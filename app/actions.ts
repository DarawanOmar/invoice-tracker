"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { reserveInvoiceNumbers, toInvoiceView } from "@/lib/data";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  invoiceDataSchema,
  MAX_INVOICES_PER_PRINT,
  MAX_MULTIPLE_INVOICES,
  printSettingsSchema,
  type InvoiceData,
  type InvoiceView,
  type PrintSettings,
} from "@/lib/invoice";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const INVALID_INPUT = "زانیارییەکان دروست نین، تکایە خانەکان بپشکنە.";
const SAVE_FAILED = "پاشەکەوتکردن سەرکەوتوو نەبوو، تکایە دووبارە هەوڵ بدەرەوە.";

function fail(error: string) {
  return { ok: false, error } as const;
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

const newPrintSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("SINGLE"),
    invoices: z.array(invoiceDataSchema).length(1),
    settings: printSettingsSchema,
  }),
  z.object({
    mode: z.literal("MULTIPLE"),
    invoices: z.array(invoiceDataSchema).min(1).max(MAX_MULTIPLE_INVOICES),
    settings: printSettingsSchema,
  }),
  z.object({
    mode: z.literal("RANGE"),
    count: z.number().int().min(1).max(MAX_INVOICES_PER_PRINT),
    /** Printed on every receipt of the range (blank for hand-filled books). */
    data: invoiceDataSchema,
    settings: printSettingsSchema,
  }),
]);

const NUMBERING_ATTEMPTS = 3;

/**
 * Saves new invoices with the next sequential numbers, records the print job
 * and returns what to print. Numbers are always assigned here, never by the
 * browser, and a number is never issued twice.
 */
export async function printNewInvoices(
  input: z.input<typeof newPrintSchema>,
): Promise<ActionResult<{ invoices: InvoiceView[]; nextNumber: number }>> {
  const parsed = newPrintSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_INPUT);
  const job = parsed.data;
  const { mode, settings } = job;

  const invoices: InvoiceData[] =
    job.mode === "RANGE" ? Array.from({ length: job.count }, () => job.data) : job.invoices;
  if (mode !== "RANGE" && invoices.some((invoice) => !invoice.recipientName)) {
    return fail("ناوی وەرگر (درا بە بەڕێز) پێویستە.");
  }

  const now = new Date();
  for (let attempt = 1; attempt <= NUMBERING_ATTEMPTS; attempt++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const first = await reserveInvoiceNumbers(tx, invoices.length);
        const rows = await tx.invoice.createManyAndReturn({
          data: invoices.map((invoice, i) => ({
            number: first + i,
            // Kurdistan wall-clock time, stored without a time-zone conversion.
            date: invoice.date ? new Date(`${invoice.date}:00Z`) : null,
            recipientName: invoice.recipientName || null,
            amountIqd: invoice.amountIqd,
            amountUsd: invoice.amountUsd,
            amountInWords: invoice.amountInWords || null,
            purpose: invoice.purpose || null,
            remainingIqd: invoice.remainingIqd,
            remainingUsd: invoice.remainingUsd,
            note: invoice.note || null,
            printCount: settings.copies,
            lastPrintedAt: now,
          })),
        });
        await tx.printJob.create({
          data: {
            mode,
            paperSize: settings.paperSize,
            copies: settings.copies,
            invoiceCount: rows.length,
            totalPrints: rows.length * settings.copies,
            fromNumber: first,
            toNumber: first + rows.length - 1,
            items: { createMany: { data: rows.map((row) => ({ invoiceId: row.id })) } },
          },
        });
        return rows.sort((a, b) => a.number - b.number);
      });

      revalidatePath("/");
      revalidatePath("/history");
      return {
        ok: true,
        data: {
          invoices: created.map(toInvoiceView),
          nextNumber: created[created.length - 1].number + 1,
        },
      };
    } catch (error) {
      // Someone else took the same numbers at the same moment — try again.
      if (isUniqueViolation(error) && attempt < NUMBERING_ATTEMPTS) continue;
      console.error(error);
      return fail(SAVE_FAILED);
    }
  }
  return fail(SAVE_FAILED);
}

/** Bumps print counters for already-saved invoices and logs the job. */
async function recordReprint(
  ids: string[],
  settings: PrintSettings,
  range: { from: number; to: number } | null,
): Promise<ActionResult<{ invoices: InvoiceView[] }>> {
  const now = new Date();
  try {
    const rows = await prisma.$transaction(async (tx) => {
      await tx.invoice.updateMany({
        where: { id: { in: ids } },
        data: { printCount: { increment: settings.copies }, lastPrintedAt: now },
      });
      await tx.printJob.create({
        data: {
          mode: "REPRINT",
          paperSize: settings.paperSize,
          copies: settings.copies,
          invoiceCount: ids.length,
          totalPrints: ids.length * settings.copies,
          fromNumber: range?.from ?? null,
          toNumber: range?.to ?? null,
          items: { createMany: { data: ids.map((invoiceId) => ({ invoiceId })) } },
        },
      });
      return tx.invoice.findMany({ where: { id: { in: ids } }, orderBy: { number: "asc" } });
    });

    revalidatePath("/history");
    return { ok: true, data: { invoices: rows.map(toInvoiceView) } };
  } catch (error) {
    console.error(error);
    return fail(SAVE_FAILED);
  }
}

const reprintSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(MAX_INVOICES_PER_PRINT),
  settings: printSettingsSchema,
});

export async function reprintInvoices(input: z.input<typeof reprintSchema>) {
  const parsed = reprintSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_INPUT);

  const rows = await prisma.invoice.findMany({
    where: { id: { in: parsed.data.ids } },
    select: { id: true },
  });
  if (rows.length === 0) return fail("پسوڵەکان نەدۆزرانەوە، لەوانەیە سڕابنەوە.");

  return recordReprint(
    rows.map((row) => row.id),
    parsed.data.settings,
    null,
  );
}

const reprintRangeSchema = z.object({
  from: z.number().int().min(1),
  to: z.number().int().min(1),
  settings: printSettingsSchema,
});

export async function reprintRange(input: z.input<typeof reprintRangeSchema>) {
  const parsed = reprintRangeSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_INPUT);
  const { from, to, settings } = parsed.data;
  if (to < from) return fail("ژمارەی کۆتایی دەبێت لە ژمارەی سەرەتا گەورەتر بێت.");

  const rows = await prisma.invoice.findMany({
    where: { number: { gte: from, lte: to } },
    select: { id: true },
    orderBy: { number: "asc" },
    take: MAX_INVOICES_PER_PRINT + 1,
  });
  if (rows.length === 0) {
    return fail(`هیچ پسوڵەیەکی پاشەکەوتکراو لە نێوان ${from} و ${to} نییە.`);
  }
  if (rows.length > MAX_INVOICES_PER_PRINT) {
    return fail(`زۆرترین ژمارە بۆ یەکجار چاپکردن ${MAX_INVOICES_PER_PRINT} پسوڵەیە.`);
  }

  return recordReprint(
    rows.map((row) => row.id),
    settings,
    { from, to },
  );
}

export async function deleteInvoice(id: string): Promise<ActionResult<null>> {
  if (typeof id !== "string" || !id) return fail(INVALID_INPUT);
  try {
    await prisma.invoice.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return fail("پسوڵەکە نەدۆزرایەوە، لەوانەیە پێشتر سڕابێتەوە.");
    }
    console.error(error);
    return fail("سڕینەوە سەرکەوتوو نەبوو، تکایە دووبارە هەوڵ بدەرەوە.");
  }
  revalidatePath("/history");
  return { ok: true, data: null };
}
