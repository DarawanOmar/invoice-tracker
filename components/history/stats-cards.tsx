import { CalendarClockIcon, LayersIcon, PrinterIcon, ReceiptTextIcon } from "lucide-react";

import { formatNumber } from "@/lib/format";

export function StatsCards({
  stats,
}: {
  stats: { invoiceCount: number; totalPrints: number; jobCount: number; todayPrints: number };
}) {
  const items = [
    { label: "پسوڵە پاشەکەوتکراوەکان", value: stats.invoiceCount, icon: ReceiptTextIcon },
    { label: "کۆی پەڕە چاپکراوەکان", value: stats.totalPrints, icon: PrinterIcon },
    { label: "جارەکانی چاپکردن", value: stats.jobCount, icon: LayersIcon },
    { label: "چاپی ئەمڕۆ", value: stats.todayPrints, icon: CalendarClockIcon },
  ];

  return (
    <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs sm:p-4">
          <span className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground sm:flex">
            <Icon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col">
            <dt className="truncate text-xs text-muted-foreground">{label}</dt>
            <dd className="text-xl font-bold tabular-nums">{formatNumber(value)}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
