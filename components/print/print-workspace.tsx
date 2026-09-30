"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  FileTextIcon,
  FilesIcon,
  HashIcon,
  ListOrderedIcon,
  PlusIcon,
  PrinterIcon,
  Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { printNewInvoices } from "@/app/actions";
import { InvoiceSheet } from "@/components/invoice/invoice-sheet";
import { usePrint } from "@/components/invoice/print-provider";
import { ScaledPreview } from "@/components/invoice/scaled-preview";
import { BLANK_DATA, draftToData, newDraft, type Draft } from "@/components/print/draft";
import { InvoiceFields, type DraftErrors } from "@/components/print/invoice-fields";
import { IntegerInput } from "@/components/print/number-inputs";
import { PrintSettingsFields } from "@/components/print/print-settings-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatMoney, parseAmount, parseInteger } from "@/lib/format";
import {
  MAX_INVOICES_PER_PRINT,
  MAX_MULTIPLE_INVOICES,
  pageCount,
  type InvoiceData,
} from "@/lib/invoice";
import { usePrintSettings } from "@/lib/use-print-settings";
import { cn } from "@/lib/utils";

type Mode = "single" | "multiple" | "range";

type Errors = {
  rangeCount?: string;
  drafts?: Record<string, DraftErrors>;
};

type Job =
  | { mode: "SINGLE" | "MULTIPLE"; invoices: InvoiceData[] }
  | { mode: "RANGE"; count: number; data: InvoiceData };

const NAME_REQUIRED = "ناوی وەرگر پێویستە.";
const DEFAULT_RANGE_SIZE = "10";

/** Read-only display of the number(s) the next print will get. */
function AutoNumber({ first, count }: { first: number; count: number }) {
  const last = first + count - 1;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-primary/30 bg-accent/40 px-3.5 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">
          {count > 1 ? "ژمارەی پسوڵەکان" : "ژمارەی پسوڵە"}
        </span>
        <span dir="ltr" className="self-start text-xl font-bold text-primary tabular-nums">
          {count > 1 ? `No. ${first} – ${last}` : `No. ${first}`}
        </span>
      </div>
      <Badge variant="secondary" className="shrink-0">
        <HashIcon />
        خۆکار
      </Badge>
    </div>
  );
}

export function PrintWorkspace({ nextNumber, today }: { nextNumber: number; today: string }) {
  const router = useRouter();
  const print = usePrint();
  const [settings, setSettings] = usePrintSettings();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("single");
  const [errors, setErrors] = useState<Errors>({});

  const [single, setSingle] = useState(() => newDraft(today));

  const [drafts, setDrafts] = useState(() => [newDraft(today)]);
  const [active, setActive] = useState(0);

  const [rangeCountInput, setRangeCountInput] = useState(DEFAULT_RANGE_SIZE);
  const [rangeFill, setRangeFill] = useState(false);
  const [rangeDraft, setRangeDraft] = useState(() => newDraft(today));

  const rangeCount = parseInteger(rangeCountInput) ?? 0;

  // What the preview shows and how many invoices the print button covers.
  let previewData: InvoiceData;
  let previewNumber = nextNumber;
  let invoiceCount: number;
  if (mode === "single") {
    previewData = draftToData(single);
    invoiceCount = 1;
  } else if (mode === "multiple") {
    previewData = draftToData(drafts[active]);
    previewNumber = nextNumber + active;
    invoiceCount = drafts.length;
  } else {
    previewData = rangeFill ? draftToData(rangeDraft) : BLANK_DATA;
    invoiceCount = rangeCount;
  }

  function clearDraftError(key: string) {
    if (!errors.drafts?.[key]) return;
    setErrors(({ drafts: draftErrors, ...rest }) => {
      const next = { ...draftErrors };
      delete next[key];
      return { ...rest, drafts: next };
    });
  }

  function updateSingle(patch: Partial<Draft>) {
    setSingle((draft) => ({ ...draft, ...patch }));
    if (patch.recipientName !== undefined) clearDraftError(single.key);
  }

  function updateDraft(index: number, patch: Partial<Draft>) {
    setDrafts((list) => list.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)));
    if (patch.recipientName !== undefined) clearDraftError(drafts[index].key);
  }

  function addDraft(copyFrom?: Draft) {
    if (drafts.length >= MAX_MULTIPLE_INVOICES) return;
    const last = drafts[drafts.length - 1];
    setDrafts((list) => [...list, newDraft(last?.date ?? today, copyFrom)]);
    setActive(drafts.length);
  }

  function removeDraft(index: number) {
    if (drafts.length <= 1) return;
    setDrafts((list) => list.filter((_, i) => i !== index));
    setActive((current) => Math.max(0, current >= index ? current - 1 : current));
  }

  /** Validates the current mode and returns what to save and print. */
  function buildJob(): Job | null {
    const next: Errors = {};
    let job: Job | null = null;

    if (mode === "single") {
      if (!single.recipientName.trim()) {
        next.drafts = { [single.key]: { recipientName: NAME_REQUIRED } };
      } else {
        job = { mode: "SINGLE", invoices: [draftToData(single)] };
      }
    } else if (mode === "multiple") {
      const missing = drafts.filter((draft) => !draft.recipientName.trim());
      if (missing.length) {
        next.drafts = Object.fromEntries(
          missing.map((draft) => [draft.key, { recipientName: NAME_REQUIRED }]),
        );
        setActive(drafts.indexOf(missing[0]));
      } else {
        job = { mode: "MULTIPLE", invoices: drafts.map(draftToData) };
      }
    } else if (rangeCount < 1) {
      next.rangeCount = "ژمارەیەک لە 1 بەرەو سەر بنووسە.";
    } else if (rangeCount > MAX_INVOICES_PER_PRINT) {
      next.rangeCount = `زۆرترین ژمارە بۆ یەکجار چاپکردن ${MAX_INVOICES_PER_PRINT} پسوڵەیە.`;
    } else {
      job = { mode: "RANGE", count: rangeCount, data: rangeFill ? draftToData(rangeDraft) : BLANK_DATA };
    }

    setErrors(next);
    if (!job) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      });
    }
    return job;
  }

  function resetAfterPrint() {
    setSingle(newDraft(single.date));
    setDrafts([newDraft(today)]);
    setActive(0);
    setRangeDraft(newDraft(today));
  }

  function handlePrint() {
    if (pending) return;
    const job = buildJob();
    if (!job) return;

    startTransition(async () => {
      const result = await printNewInvoices({ ...job, settings });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { invoices } = result.data;
      const firstNo = invoices[0].number;
      const lastNo = invoices[invoices.length - 1].number;
      resetAfterPrint();
      toast.success(
        invoices.length === 1
          ? `پسوڵەی ژمارە ${firstNo} پاشەکەوت کرا و نێردرا بۆ چاپ.`
          : `${invoices.length} پسوڵە (${firstNo} – ${lastNo}) پاشەکەوت کران و نێردران بۆ چاپ.`,
        { action: { label: "مێژوو", onClick: () => router.push("/history") } },
      );
      await print({ invoices, settings });
    });
  }

  const onPrintShortcut = useEffectEvent((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.code === "KeyP") {
      event.preventDefault();
      handlePrint();
    }
  });

  const onWindowFocus = useEffectEvent(() => {
    // Another computer may have printed meanwhile — show the current next number.
    if (!pending) router.refresh();
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => onPrintShortcut(event);
    const onFocus = () => onWindowFocus();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const pages = pageCount(invoiceCount, settings);
  const printLabel =
    invoiceCount > 1 ? `پاشەکەوتکردن و چاپکردنی ${invoiceCount} پسوڵە` : "پاشەکەوتکردن و چاپکردن";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
      <Card className="gap-0 py-0">
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(value as Mode);
            setErrors({});
          }}
          className="gap-0"
        >
          <div className="border-b p-4">
            <TabsList className="h-10! w-full">
              <TabsTrigger value="single">
                <FileTextIcon />
                تاک
              </TabsTrigger>
              <TabsTrigger value="multiple">
                <FilesIcon />
                چەند پسوڵەیەک
              </TabsTrigger>
              <TabsTrigger value="range">
                <ListOrderedIcon />
                مەودا
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent ref={formRef} className="p-4 sm:p-5">
            <TabsContent value="single" className="flex flex-col gap-5">
              <AutoNumber first={nextNumber} count={1} />
              <InvoiceFields
                draft={single}
                today={today}
                errors={errors.drafts?.[single.key]}
                onChange={updateSingle}
              />
            </TabsContent>

            <TabsContent value="multiple" className="flex flex-col gap-4">
              <AutoNumber first={nextNumber} count={drafts.length} />

              <ol className="flex flex-col gap-2">
                {drafts.map((draft, index) => {
                  const isActive = index === active;
                  const error = errors.drafts?.[draft.key]?.recipientName;
                  const amount = formatMoney(parseAmount(draft.amountIqd), parseAmount(draft.amountUsd));
                  return (
                    <li
                      key={draft.key}
                      className={cn(
                        "rounded-lg border bg-card transition-colors",
                        isActive ? "border-ring ring-2 ring-ring/25" : error && "border-destructive",
                      )}
                    >
                      <div className="flex items-center gap-1 p-2 ps-3">
                        <button
                          type="button"
                          aria-expanded={isActive}
                          onClick={() => setActive(index)}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <span
                            dir="ltr"
                            className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground tabular-nums"
                          >
                            No. {nextNumber + index}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate text-sm font-medium",
                                !draft.recipientName && "text-muted-foreground",
                              )}
                            >
                              {draft.recipientName || "ناوی وەرگر نەنووسراوە"}
                            </span>
                            {error ? (
                              <span className="block text-xs text-destructive">{error}</span>
                            ) : (
                              amount && (
                                <span className="block truncate text-xs text-muted-foreground">{amount}</span>
                              )
                            )}
                          </span>
                        </button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="لەبەرگرتنەوەی پسوڵە"
                              disabled={drafts.length >= MAX_MULTIPLE_INVOICES}
                              onClick={() => addDraft(draft)}
                            >
                              <CopyIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>لەبەرگرتنەوە</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="لابردنی پسوڵە"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={drafts.length <= 1}
                              onClick={() => removeDraft(index)}
                            >
                              <Trash2Icon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>لابردن</TooltipContent>
                        </Tooltip>
                      </div>
                      {isActive && (
                        <div className="border-t p-4">
                          <InvoiceFields
                            draft={draft}
                            today={today}
                            errors={errors.drafts?.[draft.key]}
                            onChange={(patch) => updateDraft(index, patch)}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>

              <Button
                variant="outline"
                className="border-dashed"
                disabled={drafts.length >= MAX_MULTIPLE_INVOICES}
                onClick={() => addDraft()}
              >
                <PlusIcon />
                زیادکردنی پسوڵەیەکی تر
              </Button>
            </TabsContent>

            <TabsContent value="range" className="flex flex-col gap-5">
              <AutoNumber first={nextNumber} count={Math.max(rangeCount, 1)} />

              <Field data-invalid={errors.rangeCount ? true : undefined}>
                <FieldLabel htmlFor="range-count">ژمارەی پسوڵەکان</FieldLabel>
                <IntegerInput
                  id="range-count"
                  className="max-w-40"
                  value={rangeCountInput}
                  aria-invalid={errors.rangeCount ? true : undefined}
                  onChange={setRangeCountInput}
                />
                {errors.rangeCount ? (
                  <FieldError>{errors.rangeCount}</FieldError>
                ) : (
                  <FieldDescription>
                    چەند پسوڵەی ژمارەدار بە ڕیز چاپ بکرێت (زۆرترین {MAX_INVOICES_PER_PRINT}).
                  </FieldDescription>
                )}
              </Field>

              <Field orientation="horizontal" className="rounded-lg border bg-muted/40 p-3">
                <Checkbox
                  id="range-fill"
                  checked={rangeFill}
                  onCheckedChange={(checked) => setRangeFill(checked === true)}
                />
                <FieldContent>
                  <FieldLabel htmlFor="range-fill">پڕکردنەوەی زانیاریی هاوبەش</FieldLabel>
                  <FieldDescription>
                    {rangeFill
                      ? "ئەم زانیارییانە لەسەر هەموو پسوڵەکانی مەوداکە چاپ دەکرێن."
                      : "پسوڵەکان بەتاڵ و ژمارەدار چاپ دەکرێن، وەک دەفتەری پسوڵە، بۆ ئەوەی بە دەست پڕبکرێنەوە."}
                  </FieldDescription>
                </FieldContent>
              </Field>

              {rangeFill && (
                <InvoiceFields
                  draft={rangeDraft}
                  today={today}
                  requireRecipient={false}
                  onChange={(patch) => setRangeDraft((draft) => ({ ...draft, ...patch }))}
                />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>

        <CardFooter className="flex-col items-stretch gap-4 border-t bg-muted/30 p-4 sm:p-5">
          <PrintSettingsFields settings={settings} onChange={setSettings} />
          <Button
            size="lg"
            className="h-11 w-full text-base"
            disabled={pending || invoiceCount === 0}
            onClick={handlePrint}
          >
            {pending ? <Spinner /> : <PrinterIcon />}
            {pending ? "پاشەکەوتکردن…" : printLabel}
          </Button>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>
              <span className="tabular-nums">{pages}</span> پەڕەی{" "}
              <span dir="ltr">{settings.paperSize}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              کورتەڕێ:
              <Kbd dir="ltr">Ctrl + P</Kbd>
            </span>
          </p>
        </CardFooter>
      </Card>

      <section aria-label="پێشبینینی چاپ" className="flex flex-col gap-3 lg:sticky lg:top-22">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">پێشبینینی چاپ</h2>
          {mode === "multiple" && drafts.length > 1 ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="پسوڵەی پێشوو"
                disabled={active === 0}
                onClick={() => setActive(active - 1)}
              >
                <ChevronRightIcon />
              </Button>
              <span className="tabular-nums">
                {active + 1} / {drafts.length}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="پسوڵەی دواتر"
                disabled={active === drafts.length - 1}
                onClick={() => setActive(active + 1)}
              >
                <ChevronLeftIcon />
              </Button>
            </div>
          ) : (
            mode === "range" &&
            rangeCount > 1 && (
              <span className="text-sm text-muted-foreground">
                یەکەم پسوڵەی مەوداکە — <span className="tabular-nums">{rangeCount}</span> پسوڵە
              </span>
            )
          )}
        </div>
        <div className="rounded-xl border bg-[repeating-linear-gradient(135deg,var(--muted)_0_10px,transparent_10px_20px)] p-3 sm:p-6">
          <div className="overflow-hidden rounded-sm bg-white shadow-lg ring-1 ring-black/5">
            <ScaledPreview>
              <InvoiceSheet invoice={{ number: previewNumber, ...previewData }} />
            </ScaledPreview>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          ئەوەی لێرە دەیبینیت هەمان شتە کە چاپ دەکرێت. ئەگەر ڕەنگی شریتەکە لە چاپدا دەرنەکەوت، لە پەنجەرەی چاپدا{" "}
          <span dir="ltr">Background graphics</span> چالاک بکە.
        </p>
      </section>
    </div>
  );
}
