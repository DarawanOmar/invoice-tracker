// Converts numbers to Sorani Kurdish words, e.g. 250000 → "دووسەد و پەنجا هەزار".

const ONES = ["", "یەک", "دوو", "سێ", "چوار", "پێنج", "شەش", "حەوت", "هەشت", "نۆ"];
const TEENS = [
  "دە",
  "یازدە",
  "دوازدە",
  "سێزدە",
  "چواردە",
  "پازدە",
  "شازدە",
  "حەڤدە",
  "هەژدە",
  "نۆزدە",
];
const TENS = ["", "", "بیست", "سی", "چل", "پەنجا", "شەست", "حەفتا", "هەشتا", "نەوەد"];
const HUNDREDS = [
  "",
  "سەد",
  "دووسەد",
  "سێسەد",
  "چوارسەد",
  "پێنسەد",
  "شەشسەد",
  "حەوتسەد",
  "هەشتسەد",
  "نۆسەد",
];
const SCALES = ["", "هەزار", "ملیۆن", "ملیار", "تریلیۆن"];
const AND = " و ";

function belowThousand(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds) parts.push(HUNDREDS[hundreds]);
  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10]);
  } else {
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    if (tens) parts.push(TENS[tens]);
    if (ones) parts.push(ONES[ones]);
  }
  return parts.join(AND);
}

export function integerToKurdishWords(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  let n = Math.floor(value);
  if (n === 0) return "سفر";

  const groups: number[] = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  if (groups.length > SCALES.length) return "";

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (!group) continue;
    if (i === 0) parts.push(belowThousand(group));
    // "هەزار" rather than "یەک هەزار"
    else if (i === 1 && group === 1) parts.push(SCALES[1]);
    else parts.push(`${belowThousand(group)} ${SCALES[i]}`);
  }
  return parts.join(AND);
}

/** "دووسەد و پەنجا هەزار دینار و سەد دۆلار" */
export function amountToKurdishWords(
  iqd: number | null | undefined,
  usd: number | null | undefined,
): string {
  const parts: string[] = [];

  if (iqd) parts.push(`${integerToKurdishWords(iqd)} دینار`);

  if (usd) {
    const dollars = Math.floor(usd);
    const cents = Math.round((usd - dollars) * 100);
    const usdParts: string[] = [];
    if (dollars) usdParts.push(`${integerToKurdishWords(dollars)} دۆلار`);
    if (cents) usdParts.push(`${integerToKurdishWords(cents)} سەنت`);
    parts.push(usdParts.join(AND));
  }

  return parts.join(AND);
}
