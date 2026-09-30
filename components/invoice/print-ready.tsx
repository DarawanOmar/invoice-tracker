"use client";

import { CircleCheckIcon, PrinterIcon } from "lucide-react";

import { usePrinter } from "@/components/invoice/print-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Shown on phones and tablets after saving: their browsers only open the print
 * dialog from a direct tap, so the pages are prepared first and printed here.
 */
export function PrintReadyPanel({
  title,
  description,
  onClose,
}: {
  title: string;
  description: string;
  onClose: () => void;
}) {
  const printer = usePrinter();

  return (
    <>
      <DialogHeader className="items-center text-center sm:items-center sm:text-center">
        <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CircleCheckIcon className="size-6" />
        </span>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Button size="lg" className="h-12 text-base" onClick={() => printer.open()}>
          <PrinterIcon />
          چاپکردن
        </Button>
        <Button variant="outline" size="lg" className="h-12" onClick={onClose}>
          داخستن
        </Button>
      </div>
    </>
  );
}

export function PrintReadyDialog({
  open,
  title,
  description,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <PrintReadyPanel title={title} description={description} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
