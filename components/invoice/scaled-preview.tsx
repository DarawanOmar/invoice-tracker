"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// 210mm × 148mm at the CSS reference of 96px per inch.
const SHEET_WIDTH_PX = (210 / 25.4) * 96;

/** Shrinks a full-size printed sheet to fit the width of its container. */
export function ScaledPreview({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / SHEET_WIDTH_PX);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-210/148 w-full overflow-hidden", className)}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: SHEET_WIDTH_PX,
          transform: `scale(${scale ?? 0})`,
          visibility: scale ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
