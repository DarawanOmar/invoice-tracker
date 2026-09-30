import { InvoiceSheet } from "@/components/invoice/invoice-sheet";
import { ScaledPreview } from "@/components/invoice/scaled-preview";
import { receiptsPerPage, type InvoiceContent, type PaperSize } from "@/lib/invoice";
import { cn } from "@/lib/utils";

/** One printed page, scaled down: A5 shows the receipt, A4 shows it twice. */
export function PaperPreview({
  invoice,
  paperSize,
  className,
}: {
  invoice: InvoiceContent;
  paperSize: PaperSize;
  className?: string;
}) {
  const perPage = receiptsPerPage(paperSize);

  return (
    <div
      className={cn(
        "mx-auto w-full overflow-hidden rounded-sm bg-white shadow-lg ring-1 ring-black/5",
        paperSize === "A4" && "max-w-sm",
        className,
      )}
    >
      <ScaledPreview heightMm={148 * perPage}>
        <div className="inv-pair">
          {Array.from({ length: perPage }, (_, i) => (
            <InvoiceSheet key={i} invoice={invoice} />
          ))}
        </div>
      </ScaledPreview>
    </div>
  );
}
