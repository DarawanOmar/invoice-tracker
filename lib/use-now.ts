"use client";

import { useSyncExternalStore } from "react";

import { toLocalDateTime } from "@/lib/format";

const TICK_MS = 15_000;

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, TICK_MS);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/** Current Kurdistan time ("YYYY-MM-DDTHH:mm"), kept up to date to the minute. */
export function useNow(serverNow: string) {
  return useSyncExternalStore(subscribe, () => toLocalDateTime(), () => serverNow);
}
