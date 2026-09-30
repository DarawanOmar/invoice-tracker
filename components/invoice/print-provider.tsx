"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal, flushSync } from "react-dom";

import { InvoiceSheet } from "@/components/invoice/invoice-sheet";
import { sheetsPerPage, type InvoiceContent, type PrintSettings } from "@/lib/invoice";

type PrintRequest = { invoices: InvoiceContent[]; settings: PrintSettings };
type PrintFn = (request: PrintRequest) => Promise<void>;

const PrintContext = createContext<PrintFn | null>(null);

export function usePrint() {
  const print = use(PrintContext);
  if (!print) throw new Error("usePrint must be used inside <PrintProvider>");
  return print;
}

const subscribeNoop = () => () => {};

/**
 * Renders the sheets to print into a hidden #print-root (a direct child of
 * <body>) and opens the browser's print dialog. While printing, the print
 * CSS hides everything else on the page.
 */
export function PrintProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<PrintRequest | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    const done = () => {
      delete document.documentElement.dataset.printing;
      setRequest(null);
    };
    window.addEventListener("afterprint", done);
    return () => window.removeEventListener("afterprint", done);
  }, []);

  const print = useCallback<PrintFn>(async (next) => {
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
    window.print();
  }, []);

  return (
    <PrintContext value={print}>
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
  const sheets = invoices.flatMap((invoice) =>
    Array.from({ length: settings.copies }, () => invoice),
  );
  const perPage = sheetsPerPage(settings.paperSize);
  const pages: InvoiceContent[][] = [];
  for (let i = 0; i < sheets.length; i += perPage) {
    pages.push(sheets.slice(i, i + perPage));
  }
  const pageSize = settings.paperSize === "A4" ? "A4 portrait" : "A5 landscape";

  return (
    <>
      <style>{`@page { size: ${pageSize}; margin: 0; }`}</style>
      {pages.map((page, i) => (
        <div key={i} className="print-page" data-size={settings.paperSize}>
          {page.map((invoice, j) => (
            <InvoiceSheet key={j} invoice={invoice} />
          ))}
        </div>
      ))}
    </>
  );
}
