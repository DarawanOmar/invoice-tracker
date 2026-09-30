"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { MAX_COPIES, PAPER_SIZES, type PrintSettings } from "@/lib/invoice";

// Remembers the last paper size and copy count on this browser.
const STORAGE_KEY = "invoice-tracker:print-settings";
const DEFAULT_SETTINGS: PrintSettings = { paperSize: "A5", copies: 1 };

const listeners = new Set<() => void>();
let memoryValue = "";

function read() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? memoryValue;
  } catch {
    return memoryValue;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function parse(raw: string): PrintSettings {
  try {
    const value = JSON.parse(raw) as Partial<PrintSettings>;
    const paperSize = PAPER_SIZES.includes(value.paperSize!) ? value.paperSize! : "A5";
    const copies =
      Number.isInteger(value.copies) && value.copies! >= 1 && value.copies! <= MAX_COPIES
        ? value.copies!
        : 1;
    return { paperSize, copies };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function usePrintSettings() {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const settings = useMemo(() => (raw ? parse(raw) : DEFAULT_SETTINGS), [raw]);

  const update = useCallback((next: PrintSettings) => {
    memoryValue = JSON.stringify(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, memoryValue);
    } catch {
      // Storage unavailable (private mode) — the in-memory value still works.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [settings, update] as const;
}
