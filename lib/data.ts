import "server-only";

import { APP_UTC_OFFSET, FIRST_INVOICE_NUMBER } from "@/lib/company";
import { prisma } from "@/lib/db";
import { todayIso } from "@/lib/format";
import type { Invoice, Prisma } from "@/lib/generated/prisma/client";
import type { InvoiceView, PrintJobView } from "@/lib/invoice";

export const INVOICES_PAGE_SIZE = 20;
export const JOBS_PAGE_SIZE = 20;

function decimalToNumber(value: Prisma.Decimal | null) {
  return value === null ? null : value.toNumber();
}

export function toInvoiceView(row: Invoice): InvoiceView {
  return {
    id: row.id,
    number: row.number,
    date: row.date ? row.date.toISOString().slice(0, 10) : null,
    recipientName: row.recipientName ?? "",
    amountIqd: decimalToNumber(row.amountIqd),
    amountUsd: decimalToNumber(row.amountUsd),
    amountInWords: row.amountInWords ?? "",
    purpose: row.purpose ?? "",
    remainingIqd: decimalToNumber(row.remainingIqd),
    remainingUsd: decimalToNumber(row.remainingUsd),
    printCount: row.printCount,
    lastPrintedAt: row.lastPrintedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

const COUNTER_ID = 1;

/** Highest number ever issued, including invoices that were deleted since. */
async function lastIssuedNumber(db: Prisma.TransactionClient) {
  const counter = await db.invoiceCounter.findUnique({ where: { id: COUNTER_ID } });
  const { _max } = await db.invoice.aggregate({ _max: { number: true } });
  return Math.max(counter?.lastNumber ?? 0, _max.number ?? 0, FIRST_INVOICE_NUMBER - 1);
}

export async function getNextInvoiceNumber() {
  return (await lastIssuedNumber(prisma)) + 1;
}

/**
 * Reserves `count` sequential numbers inside a transaction and returns the
 * first one. Two concurrent reservations can read the same value; the unique
 * index on Invoice.number then rejects one of them and the caller retries.
 */
export async function reserveInvoiceNumbers(tx: Prisma.TransactionClient, count: number) {
  const first = (await lastIssuedNumber(tx)) + 1;
  const lastNumber = first + count - 1;
  await tx.invoiceCounter.upsert({
    where: { id: COUNTER_ID },
    create: { id: COUNTER_ID, lastNumber },
    update: { lastNumber },
  });
  return first;
}

export async function getStats() {
  const startOfToday = new Date(`${todayIso()}T00:00:00${APP_UTC_OFFSET}`);
  // Sheet totals come from the print log, so they include deleted invoices.
  const [invoiceCount, prints, jobCount, today] = await Promise.all([
    prisma.invoice.count(),
    prisma.printJob.aggregate({ _sum: { totalPrints: true } }),
    prisma.printJob.count(),
    prisma.printJob.aggregate({
      _sum: { totalPrints: true },
      where: { createdAt: { gte: startOfToday } },
    }),
  ]);
  return {
    invoiceCount,
    totalPrints: prints._sum.totalPrints ?? 0,
    jobCount,
    todayPrints: today._sum.totalPrints ?? 0,
  };
}

function clampPage(page: number, total: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return { page: Math.min(Math.max(1, page), pageCount), pageCount };
}

export async function listInvoices({ query, page }: { query: string; page: number }) {
  const q = query.trim();
  const where: Prisma.InvoiceWhereInput = q
    ? {
        OR: [
          ...(/^\d{1,9}$/.test(q) ? [{ number: Number(q) }] : []),
          { recipientName: { contains: q, mode: "insensitive" } },
          { purpose: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const total = await prisma.invoice.count({ where });
  const paging = clampPage(page, total, INVOICES_PAGE_SIZE);
  const rows = await prisma.invoice.findMany({
    where,
    orderBy: { number: "desc" },
    skip: (paging.page - 1) * INVOICES_PAGE_SIZE,
    take: INVOICES_PAGE_SIZE,
  });

  return { items: rows.map(toInvoiceView), total, ...paging };
}

const JOB_NUMBERS_PREVIEW = 8;

export async function listPrintJobs({ page }: { page: number }) {
  const total = await prisma.printJob.count();
  const paging = clampPage(page, total, JOBS_PAGE_SIZE);
  const rows = await prisma.printJob.findMany({
    orderBy: { createdAt: "desc" },
    skip: (paging.page - 1) * JOBS_PAGE_SIZE,
    take: JOBS_PAGE_SIZE,
    include: {
      items: {
        select: { invoice: { select: { number: true } } },
        orderBy: { invoice: { number: "asc" } },
        take: JOB_NUMBERS_PREVIEW,
      },
    },
  });

  const items: PrintJobView[] = rows.map((job) => ({
    id: job.id,
    mode: job.mode,
    paperSize: job.paperSize,
    copies: job.copies,
    invoiceCount: job.invoiceCount,
    totalPrints: job.totalPrints,
    fromNumber: job.fromNumber,
    toNumber: job.toNumber,
    createdAt: job.createdAt.toISOString(),
    numbers: job.items.map((item) => item.invoice.number),
  }));

  return { items, total, ...paging };
}
