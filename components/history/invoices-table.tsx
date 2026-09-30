"use client";

import { FileSearchIcon, PrinterIcon, ReceiptTextIcon, Trash2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteInvoice } from "@/app/actions";
import { ReprintDialog, type ReprintTarget } from "@/components/history/reprint-dialog";
import { SearchInput } from "@/components/history/search-input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatLocalDateTime, formatNumber } from "@/lib/format";
import type { InvoiceView } from "@/lib/invoice";

function MoneyCell({ iqd, usd }: { iqd: number | null; usd: number | null }) {
  if (!iqd && !usd) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col gap-0.5 whitespace-nowrap tabular-nums">
      {iqd ? <span>{formatNumber(iqd)} دینار</span> : null}
      {usd ? <span>{formatNumber(usd)} دۆلار</span> : null}
    </div>
  );
}

export function InvoicesTable({ invoices, query }: { invoices: InvoiceView[]; query: string }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [reprintOpen, setReprintOpen] = useState(false);
  const [reprintTarget, setReprintTarget] = useState<ReprintTarget | null>(null);
  const [toDelete, setToDelete] = useState<InvoiceView | null>(null);
  const [deleting, startDelete] = useTransition();

  // Only rows on the current page can be selected.
  const selectedRows = invoices.filter((invoice) => selected.has(invoice.id));
  const allSelected = invoices.length > 0 && selectedRows.length === invoices.length;

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function openReprint(rows: InvoiceView[]) {
    setReprintTarget({ kind: "invoices", invoices: [...rows].sort((a, b) => a.number - b.number) });
    setReprintOpen(true);
  }

  function confirmDelete() {
    if (!toDelete) return;
    const invoice = toDelete;
    startDelete(async () => {
      const result = await deleteInvoice(invoice.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toggle(invoice.id, false);
      setToDelete(null);
      toast.success(`پسوڵەی ژمارە ${invoice.number} سڕایەوە.`);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
        <SearchInput defaultValue={query} />
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{selectedRows.length}</span> دیاریکراوە
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <XIcon />
              لابردنی دیاریکردن
            </Button>
            <Button size="sm" onClick={() => openReprint(selectedRows)}>
              <PrinterIcon />
              چاپکردنەوەی دیاریکراوەکان
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {invoices.length === 0 ? (
          query ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileSearchIcon />
                </EmptyMedia>
                <EmptyTitle>هیچ ئەنجامێک نەدۆزرایەوە</EmptyTitle>
                <EmptyDescription>
                  هیچ پسوڵەیەک لەگەڵ «{query}» ناگونجێت. بە ژمارەی پسوڵە، ناوی وەرگر یان «لە بڕی» بگەڕێ.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ReceiptTextIcon />
                </EmptyMedia>
                <EmptyTitle>هێشتا هیچ پسوڵەیەک چاپ نەکراوە</EmptyTitle>
                <EmptyDescription>کاتێک یەکەم پسوڵە چاپ دەکەیت، لێرە دەردەکەوێت.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/">
                    <PrinterIcon />
                    چاپکردنی پسوڵە
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          )
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-10 ps-4">
                  <Checkbox
                    aria-label="دیاریکردنی هەموو ڕیزەکان"
                    checked={allSelected ? true : selectedRows.length > 0 ? "indeterminate" : false}
                    onCheckedChange={(checked) =>
                      setSelected(checked === true ? new Set(invoices.map((i) => i.id)) : new Set())
                    }
                  />
                </TableHead>
                <TableHead>ژمارە</TableHead>
                <TableHead>بەروار</TableHead>
                <TableHead>درا بە بەڕێز</TableHead>
                <TableHead>بڕی پارە</TableHead>
                <TableHead>لە بڕی</TableHead>
                <TableHead>باقی حیساب</TableHead>
                <TableHead>چاپکراوە</TableHead>
                <TableHead>دوایین چاپ</TableHead>
                <TableHead className="w-24 pe-4">
                  <span className="sr-only">کردارەکان</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} data-state={selected.has(invoice.id) ? "selected" : undefined}>
                  <TableCell className="ps-4">
                    <Checkbox
                      aria-label={`دیاریکردنی پسوڵەی ژمارە ${invoice.number}`}
                      checked={selected.has(invoice.id)}
                      onCheckedChange={(checked) => toggle(invoice.id, checked === true)}
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      dir="ltr"
                      onClick={() => openReprint([invoice])}
                      className="rounded font-semibold text-primary tabular-nums underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      No. {invoice.number}
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {invoice.date ? (
                      <span dir="ltr">{formatLocalDateTime(invoice.date)}</span>
                    ) : (
                      <span className="text-muted-foreground">بەتاڵ</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-medium" title={invoice.recipientName}>
                    {invoice.recipientName || <span className="font-normal text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <MoneyCell iqd={invoice.amountIqd} usd={invoice.amountUsd} />
                  </TableCell>
                  <TableCell className="max-w-56 truncate" title={invoice.purpose}>
                    {invoice.purpose || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <MoneyCell iqd={invoice.remainingIqd} usd={invoice.remainingUsd} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="tabular-nums">
                      <PrinterIcon />
                      {invoice.printCount} جار
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                    {invoice.lastPrintedAt ? <span dir="ltr">{formatDateTime(invoice.lastPrintedAt)}</span> : "—"}
                  </TableCell>
                  <TableCell className="pe-4">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`چاپکردنەوەی پسوڵەی ژمارە ${invoice.number}`}
                            onClick={() => openReprint([invoice])}
                          >
                            <PrinterIcon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>بینین و چاپکردنەوە</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`سڕینەوەی پسوڵەی ژمارە ${invoice.number}`}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setToDelete(invoice)}
                          >
                            <Trash2Icon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>سڕینەوە</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ReprintDialog
        target={reprintTarget}
        open={reprintOpen}
        onOpenChange={setReprintOpen}
        onPrinted={() => setSelected(new Set())}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی پسوڵەی ژمارە {toDelete?.number}؟</AlertDialogTitle>
            <AlertDialogDescription>
              پسوڵەکە و تۆماری چاپکردنەکانی بە یەکجاری دەسڕدرێنەوە. ئەم کارە ناگەڕێتەوە.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>پاشگەزبوونەوە</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? <Spinner /> : <Trash2Icon />}
              سڕینەوە
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
