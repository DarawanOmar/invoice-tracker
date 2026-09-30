"use client";

import { HistoryIcon, PrinterIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "چاپکردنی پسوڵە", shortLabel: "چاپکردن", icon: PrinterIcon },
  { href: "/history", label: "مێژووی چاپکردن", shortLabel: "مێژوو", icon: HistoryIcon },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={COMPANY.shortName}
          className="flex shrink-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image src="/logo-mark.png" alt="" width={44} height={32} loading="eager" />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-bold">{COMPANY.shortName}</span>
            <span className="text-xs text-muted-foreground">سیستەمی چاپکردنی پسوڵە</span>
          </span>
        </Link>

        <nav aria-label="سەرەکی" className="ms-auto flex items-center gap-1">
          {NAV.map(({ href, label, shortLabel, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                  active && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
