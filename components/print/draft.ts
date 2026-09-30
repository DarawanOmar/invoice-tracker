import { parseAmount } from "@/lib/format";
import type { InvoiceData } from "@/lib/invoice";
import { amountToKurdishWords } from "@/lib/kurdish-words";

/** Form state for one invoice; amounts are kept as the raw typed digits. */
export type Draft = {
  key: string;
  /** "YYYY-MM-DDTHH:mm", or "" for a blank date. Ignored while `dateAuto` is on. */
  date: string;
  /** When true, the current time is printed. */
  dateAuto: boolean;
  recipientName: string;
  amountIqd: string;
  amountUsd: string;
  amountInWords: string;
  /** When true, "amount in words" is generated from the amounts. */
  wordsAuto: boolean;
  purpose: string;
  remainingIqd: string;
  remainingUsd: string;
  note: string;
};

let keyCounter = 0;

export function newDraft(copyFrom?: Draft): Draft {
  keyCounter += 1;
  return {
    date: "",
    dateAuto: true,
    recipientName: "",
    amountIqd: "",
    amountUsd: "",
    amountInWords: "",
    wordsAuto: true,
    purpose: "",
    remainingIqd: "",
    remainingUsd: "",
    note: "",
    ...copyFrom,
    key: `draft-${keyCounter}`,
  };
}

export function draftWords(draft: Draft) {
  return draft.wordsAuto
    ? amountToKurdishWords(parseAmount(draft.amountIqd), parseAmount(draft.amountUsd))
    : draft.amountInWords;
}

/** `now` is the current Kurdistan time, used when the date is automatic. */
export function draftToData(draft: Draft, now: string): InvoiceData {
  return {
    date: draft.dateAuto ? now : draft.date || null,
    recipientName: draft.recipientName.trim(),
    amountIqd: parseAmount(draft.amountIqd),
    amountUsd: parseAmount(draft.amountUsd),
    amountInWords: draftWords(draft).trim(),
    purpose: draft.purpose.trim(),
    remainingIqd: parseAmount(draft.remainingIqd),
    remainingUsd: parseAmount(draft.remainingUsd),
    note: draft.note.trim(),
  };
}

/** A receipt left blank to be filled in by hand. */
export const BLANK_DATA: InvoiceData = {
  date: null,
  recipientName: "",
  amountIqd: null,
  amountUsd: null,
  amountInWords: "",
  purpose: "",
  remainingIqd: null,
  remainingUsd: null,
  note: "",
};
