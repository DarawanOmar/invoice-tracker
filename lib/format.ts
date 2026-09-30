import { APP_TIME_ZONE } from "@/lib/company";

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatNumber(value: number) {
  return numberFormat.format(value);
}

/** "250,000 دینار & 100 دۆلار" — matches the "(دینار & دۆلار)" label. */
export function formatMoney(iqd: number | null, usd: number | null) {
  const parts: string[] = [];
  if (iqd) parts.push(`${formatNumber(iqd)} دینار`);
  if (usd) parts.push(`${formatNumber(usd)} دۆلار`);
  return parts.join(" & ");
}

/** Arabic-Indic (٠١٢) and Persian (۰۱۲) digits → Latin digits. */
export function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

/** Parses a user-typed whole number; returns null when empty or invalid. */
export function parseInteger(value: string) {
  const clean = normalizeDigits(value).replace(/[,\s]/g, "");
  if (!/^\d+$/.test(clean)) return null;
  const n = Number(clean);
  return Number.isSafeInteger(n) ? n : null;
}

/** Parses a user-typed amount; returns null when empty or invalid. */
export function parseAmount(value: string) {
  const clean = normalizeDigits(value).replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Today's date as YYYY-MM-DD in Kurdistan time. */
export function todayIso(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const localDateTimeFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** A moment (now by default) as Kurdistan time, "YYYY-MM-DDTHH:mm" (the datetime-local format). */
export function toLocalDateTime(date = new Date()) {
  const parts = Object.fromEntries(
    localDateTimeFormat.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** "2026-09-30T14:05" → { day: "30", month: "9", year: "2026", time: "14:05" } */
export function splitLocalDateTime(value: string) {
  const [date, time = "00:00"] = value.split("T");
  const [year, month, day] = date.split("-");
  return { day: String(Number(day)), month: String(Number(month)), year, time };
}

/** "14:05" → "2:05 PM" (12-hour clock). */
export function formatTime12(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours < 12 ? "AM" : "PM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** "2026-09-30T14:05" → "2026/09/30 2:05 PM" */
export function formatLocalDateTime(value: string) {
  const [date, time] = value.split("T");
  return `${date.replaceAll("-", "/")} ${formatTime12(time)}`;
}

/** ISO timestamp → "2026/09/30 14:05" in Kurdistan time. */
export function formatDateTime(iso: string) {
  return formatLocalDateTime(toLocalDateTime(new Date(iso)));
}
