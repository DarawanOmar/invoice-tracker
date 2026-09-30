"use client";

import { PrinterIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { reprintInvoices, reprintRange } from "@/app/actions";
import { InvoiceSheet } from "@/components/invoice/invoice-sheet";
import { usePrint } from "@/components/invoice/print-provider";
import { ScaledPreview } from "@/components/invoice/scaled-preview";
import { IntegerInput } from "@/components/print/number-inputs";
import { PrintSettingsFields } from "@/components/print/print-settings-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime, parseInteger } from "@/lib/format";
import type { InvoiceView } from "@/lib/invoice";
import { usePrintSettings } from "@/lib/use-print-settings";

export type ReprintTarget =
  | { kind: "invoices"; invoices: InvoiceView[] }
  | { kind: "range"; from?: number; to?: number };

const MAX_LISTED_NUMBERS = 24;

export function ReprintDialog({
  target,
  open,
  onOpenChange,
  onPrinted,
}: {
  target: ReprintTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrinted?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        {target && (
          <ReprintForm
            // Fresh form state for every target.
            key={target.kind === "range" ? "range" : target.invoices.map((i) => i.id).join()}
            target={target}
            onDone={() => {
              onOpenChange(false);
              onPrinted?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReprintForm({ target, onDone }: { target: ReprintTarget; onDone: () => void }) {
  const print = usePrint();
  const [settings, setSettings] = usePrintSettings();
  const [pending, startTransition] = useTransition();
  const [from, setFrom] = useState(target.kind === "range" && target.from ? String(target.from) : "");
  const [to, setTo] = useState(target.kind === "range" && target.to ? String(target.to) : "");
  const [error, setError] = useState<string | null>(null);

  const invoices = target.kind === "invoices" ? target.invoices : [];
  const first = invoices[0];

  function submit() {
    setError(null);
    let rangeInput: { from: number; to: number } | null = null;
    if (target.kind === "range") {
      const fromNo = parseInteger(from);
      const toNo = parseInteger(to);
      if (!fromNo || !toNo) return setError("هەردوو ژمارەکە بنووسە.");
      if (toNo < fromNo) return setError("ژمارەی کۆتایی دەبێت گەورەتر یان یەکسان بێت بە ژمارەی سەرەتا.");
      rangeInput = { from: fromNo, to: toNo };
    }

    startTransition(async () => {
      const result = rangeInput
        ? await reprintRange({ ...rangeInput, settings })
        : await reprintInvoices({ ids: invoices.map((invoice) => invoice.id), settings });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const printed = result.data.invoices;
      onDone();
      toast.success(
        printed.length === 1
          ? `پسوڵەی ژمارە ${printed[0].number} نێردرا بۆ چاپ.`
          : `${printed.length} پسوڵە نێردران بۆ چاپ.`,
      );
      await print({ invoices: printed, settings });
    });
  }

  let title: string;
  let description: React.ReactNode;
  if (target.kind === "range") {
    title = "چاپکردنەوە بە مەودای ژمارە";
    description = "هەموو پسوڵە پاشەکەوتکراوەکانی نێوان ئەم دوو ژمارەیە دووبارە چاپ دەکرێنەوە.";
  } else if (invoices.length === 1) {
    title = `پسوڵەی ژمارە ${first.number}`;
    description = (
      <>
        <span className="tabular-nums">{first.printCount}</span> جار چاپکراوە
        {first.lastPrintedAt && (
          <>
            {" "}
            · دوایین چاپ: <span dir="ltr" className="tabular-nums">{formatDateTime(first.lastPrintedAt)}</span>
          </>
        )}
      </>
    );
  } else {
    title = `چاپکردنەوەی ${invoices.length} پسوڵە`;
    description = "ئەم پسوڵانە بە هەمان زانیاری جاران دووبارە چاپ دەکرێنەوە.";
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {target.kind === "range" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="reprint-from">لە ژمارە</FieldLabel>
            <IntegerInput id="reprint-from" value={from} onChange={setFrom} autoFocus />
          </Field>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="reprint-to">بۆ ژمارە</FieldLabel>
            <IntegerInput id="reprint-to" value={to} onChange={setTo} />
          </Field>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.length > 1 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="ژمارەی پسوڵەکان">
              {invoices.slice(0, MAX_LISTED_NUMBERS).map((invoice) => (
                <li
                  key={invoice.id}
                  dir="ltr"
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground tabular-nums"
                >
                  No. {invoice.number}
                </li>
              ))}
              {invoices.length > MAX_LISTED_NUMBERS && (
                <li className="px-1 text-xs text-muted-foreground">
                  و <span className="tabular-nums">{invoices.length - MAX_LISTED_NUMBERS}</span> پسوڵەی تر
                </li>
              )}
            </ul>
          )}
          <div className="rounded-lg border bg-muted/50 p-2 sm:p-3">
            <div className="overflow-hidden rounded-sm bg-white shadow-md ring-1 ring-black/5">
              <ScaledPreview>
                <InvoiceSheet invoice={first} />
              </ScaledPreview>
            </div>
          </div>
        </div>
      )}

      <PrintSettingsFields settings={settings} onChange={setSettings} />
      {error && <FieldError>{error}</FieldError>}

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={pending}>
            پاشگەزبوونەوە
          </Button>
        </DialogClose>
        <Button onClick={submit} disabled={pending}>
          {pending ? <Spinner /> : <PrinterIcon />}
          چاپکردنەوە
        </Button>
      </DialogFooter>
    </>
  );
}
