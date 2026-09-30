"use client";

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal, flushSync } from "react-dom";

import { InvoiceSheet } from "@/components/invoice/invoice-sheet";
import { receiptsPerPage, type InvoiceContent, type PrintSettings } from "@/lib/invoice";

type PrintRequest = { invoices: InvoiceContent[]; settings: PrintSettings };

type Printer = {
  /** Renders the pages into #print-root and waits until images and fonts are ready. */
  prepare: (request: PrintRequest) => Promise<void>;
  /**
   * Opens the browser's print dialog for the prepared pages. On phones this
   * must run directly inside a tap handler. With `autoClear` the pages are
   * removed once the dialog closes (desktop browsers report that reliably).
   */
  open: (options?: { autoClear?: boolean }) => void;
  /** Removes the prepared pages. */
  clear: () => void;
};

const PrintContext = createContext<Printer | null>(null);

export function usePrinter() {
  const printer = use(PrintContext);
  if (!printer) throw new Error("usePrinter must be used inside <PrintProvider>");
  return printer;
}

const subscribeNoop = () => () => {};

/**
 * Renders the sheets to print into a hidden #print-root (a direct child of
 * <body>). While `html[data-printing]` is set, the print CSS hides everything
 * else on the page.
 */
export function PrintProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<PrintRequest | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoClearRef = useRef(false);
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const printer = useMemo<Printer>(() => {
    const clear = () => {
      autoClearRef.current = false;
      delete document.documentElement.dataset.printing;
      setRequest(null);
    };

    return {
      async prepare(next) {
        flushSync(() => setRequest(next));
        const root = rootRef.current;
        if (!root) return;
        // Force layout so web fonts and images start loading, then wait for them.
        root.getBoundingClientRect();
        await Promise.all(
          Array.from(root.querySelectorAll("img"), (img) =>
            img.complete ? undefined : img.decode().catch(() => undefined),
          ),
        );
        await document.fonts.ready;
        document.documentElement.dataset.printing = "";
      },
      open({ autoClear = false } = {}) {
        autoClearRef.current = autoClear;
        document.documentElement.dataset.printing = "";
        window.print();
      },
      clear,
    };
  }, []);

  useEffect(() => {
    const onAfterPrint = () => {
      if (autoClearRef.current) printer.clear();
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, [printer]);

  return (
    <PrintContext value={printer}>
      {children}
      {isClient &&
        createPortal(
          <div id="print-root" ref={rootRef} aria-hidden="true">
            {request && <PrintPages {...request} />}
          </div>,
          document.body,
        )}
    </PrintContext>
  );
}

function PrintPages({ invoices, settings }: PrintRequest) {
  // One page per invoice copy; on A4 the same invoice is printed twice per page.
  const pages = invoices.flatMap((invoice) =>
    Array.from({ length: settings.copies }, () => invoice),
  );
  const perPage = receiptsPerPage(settings.paperSize);
  const pageSize = settings.paperSize === "A4" ? "A4 portrait" : "A5 landscape";

  return (
    <>
      <style>{`@page { size: ${pageSize}; margin: 0; }`}</style>
      {pages.map((invoice, i) => (
        <div key={i} className="print-page inv-pair" data-size={settings.paperSize}>
          {Array.from({ length: perPage }, (_, j) => (
            <InvoiceSheet key={j} invoice={invoice} />
          ))}
        </div>
      ))}
    </>
  );
}
