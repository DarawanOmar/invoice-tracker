/* eslint-disable @next/next/no-img-element -- print output needs plain, eagerly loaded images */
import { COMPANY } from "@/lib/company";
import { formatMoney, formatTime12, splitLocalDateTime } from "@/lib/format";
import type { InvoiceContent } from "@/lib/invoice";

/** Long values shrink so they stay on the dotted line. */
function fitClass(value: string) {
  if (value.length > 90) return "fit-3";
  if (value.length > 65) return "fit-2";
  if (value.length > 48) return "fit-1";
  return undefined;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="inv-row">
      <span className="inv-label">{label}</span>
      <span className={["inv-line", fitClass(value)].filter(Boolean).join(" ")}>{value}</span>
    </div>
  );
}

function PrintedDate({ date }: { date: string | null }) {
  if (!date) {
    // Blank template, filled in by hand like the paper receipt book.
    return (
      <span className="inv-date-value is-blank">
        {"\u00a0\u00a0 / \u00a0\u00a0 / 20\u00a0\u00a0\u00a0"}
        <span className="inv-time">{"\u00a0\u00a0 : \u00a0\u00a0"}</span>
      </span>
    );
  }
  const { day, month, year, time } = splitLocalDateTime(date);
  // Read right-to-left: day / month / year, then the time.
  return (
    <span className="inv-date-value" dir="rtl">
      <bdi>{day}</bdi> / <bdi>{month}</bdi> / <bdi>{year}</bdi>
      <bdi className="inv-time">{formatTime12(time)}</bdi>
    </span>
  );
}

export function InvoiceSheet({ invoice }: { invoice: InvoiceContent }) {
  return (
    <article className="inv-sheet" dir="rtl" lang="ckb">
      <header className="inv-header">
        <div className="inv-qr">
          <img src="/qr.png" alt="" width={600} height={600} />
        </div>
        <div className="inv-title">
          <h1>{COMPANY.name}</h1>
          <p>{COMPANY.tagline}</p>
          <p className="inv-phones" dir="ltr">
            {COMPANY.phones.join(" - ")}
          </p>
        </div>
        <div className="inv-logo">
          <img src="/logo.png" alt="Digital Media Office" width={900} height={740} />
        </div>
        <div className="inv-no">No. {invoice.number}</div>
      </header>

      <div className="inv-band">
        <span className="inv-address">{COMPANY.address}</span>
        <span className="inv-date">
          بەروار:
          <PrintedDate date={invoice.date} />
        </span>
      </div>

      <div className="inv-body">
        <Row label="درا بە بەڕێز:" value={invoice.recipientName} />
        <Row
          label="بڕی پارە (دینار & دۆلار):"
          value={formatMoney(invoice.amountIqd, invoice.amountUsd)}
        />
        <Row label="بڕی پارە بە نووسین:" value={invoice.amountInWords} />
        <Row label="لە بڕی:" value={invoice.purpose} />
        <Row
          label="باقی حیساب:"
          value={formatMoney(invoice.remainingIqd, invoice.remainingUsd)}
        />
        <Row label="تێبینی:" value={invoice.note} />
      </div>

      <footer className="inv-footer">
        <span>ناو واژووی وەرگر</span>
        <span>واژوو مۆری کۆمپانیا</span>
      </footer>
    </article>
  );
}
