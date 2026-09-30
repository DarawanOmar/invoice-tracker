import { parseAmount } from "@/lib/format";
import type { InvoiceData } from "@/lib/invoice";
import { amountToKurdishWords } from "@/lib/kurdish-words";

/** Form state for one invoice; amounts are kept as the raw typed digits. */
export type Draft = {
  key: string;
  date: string;
  recipientName: string;
  amountIqd: string;
  amountUsd: string;
  amountInWords: string;
  /** When true, "amount in words" is generated from the amounts. */
  wordsAuto: boolean;
  purpose: string;
  remainingIqd: string;
  remainingUsd: string;
};

let keyCounter = 0;

export function newDraft(date: string, copyFrom?: Draft): Draft {
  keyCounter += 1;
  return {
    date,
    recipientName: "",
    amountIqd: "",
    amountUsd: "",
    amountInWords: "",
    wordsAuto: true,
    purpose: "",
    remainingIqd: "",
    remainingUsd: "",
    ...copyFrom,
    key: `draft-${keyCounter}`,
  };
}

export function draftWords(draft: Draft) {
  return draft.wordsAuto
    ? amountToKurdishWords(parseAmount(draft.amountIqd), parseAmount(draft.amountUsd))
    : draft.amountInWords;
}

export function draftToData(draft: Draft): InvoiceData {
  return {
    date: draft.date || null,
    recipientName: draft.recipientName.trim(),
    amountIqd: parseAmount(draft.amountIqd),
    amountUsd: parseAmount(draft.amountUsd),
    amountInWords: draftWords(draft).trim(),
    purpose: draft.purpose.trim(),
    remainingIqd: parseAmount(draft.remainingIqd),
    remainingUsd: parseAmount(draft.remainingUsd),
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
};
