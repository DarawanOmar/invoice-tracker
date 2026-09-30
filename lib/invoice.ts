import { z } from "zod";

export const PAPER_SIZES = ["A5", "A4"] as const;
export type PaperSize = (typeof PAPER_SIZES)[number];

export const MAX_COPIES = 10;
/** Upper bound for one print job (range mode and reprints). */
export const MAX_INVOICES_PER_PRINT = 500;
/** Upper bound for invoices typed in by hand in "multiple" mode. */
export const MAX_MULTIPLE_INVOICES = 50;

export type PrintSettings = { paperSize: PaperSize; copies: number };

/** Everything that is printed on one receipt. */
export type InvoiceContent = {
  number: number;
  /** "YYYY-MM-DDTHH:mm" in Kurdistan time, or null for a blank date to fill in by hand. */
  date: string | null;
  recipientName: string;
  amountIqd: number | null;
  amountUsd: number | null;
  amountInWords: string;
  purpose: string;
  remainingIqd: number | null;
  remainingUsd: number | null;
};

/** Receipt content before a number is assigned (numbers come from the server). */
export type InvoiceData = Omit<InvoiceContent, "number">;

/** A saved receipt, as sent to the browser. */
export type InvoiceView = InvoiceContent & {
  id: string;
  printCount: number;
  lastPrintedAt: string | null;
  createdAt: string;
};

export type PrintMode = "SINGLE" | "MULTIPLE" | "RANGE" | "REPRINT";

export type PrintJobView = {
  id: string;
  mode: PrintMode;
  paperSize: PaperSize;
  copies: number;
  invoiceCount: number;
  totalPrints: number;
  fromNumber: number | null;
  toNumber: number | null;
  createdAt: string;
  /** First few invoice numbers still linked to the job. */
  numbers: number[];
};

export const PRINT_MODE_LABELS: Record<PrintMode, string> = {
  SINGLE: "تاک",
  MULTIPLE: "چەند پسوڵەیەک",
  RANGE: "مەودا",
  REPRINT: "دووبارە چاپکردنەوە",
};

const text = (max: number) => z.string().trim().max(max);
const money = z.number().nonnegative().max(9_999_999_999_999).nullable();

const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(`${value}:00Z`)));

export const invoiceDataSchema = z.object({
  date: localDateTime.nullable(),
  recipientName: text(200),
  amountIqd: money,
  amountUsd: money,
  amountInWords: text(500),
  purpose: text(300),
  remainingIqd: money,
  remainingUsd: money,
});

export const printSettingsSchema = z.object({
  paperSize: z.enum(PAPER_SIZES),
  copies: z.number().int().min(1).max(MAX_COPIES),
});

/** Receipts on one sheet: A5 holds one, A4 holds the same receipt twice. */
export function receiptsPerPage(paperSize: PaperSize) {
  return paperSize === "A4" ? 2 : 1;
}

/** Sheets of paper used — one per invoice copy on either paper size. */
export function pageCount(invoiceCount: number, settings: PrintSettings) {
  return invoiceCount * settings.copies;
}
