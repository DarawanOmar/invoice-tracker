import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Previous / next links that keep the other search params. */
export function PaginationLinks({
  page,
  pageCount,
  total,
  param,
  searchParams,
}: {
  page: number;
  pageCount: number;
  total: number;
  param: string;
  searchParams: Record<string, string>;
}) {
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams);
    if (target <= 1) params.delete(param);
    else params.set(param, String(target));
    const search = params.toString();
    return search ? `/history?${search}` : "/history";
  };

  return (
    <nav aria-label="پەڕەکان" className="flex items-center justify-between gap-3 pt-1">
      <p className="text-sm text-muted-foreground">
        پەڕەی <span className="tabular-nums">{page}</span> لە <span className="tabular-nums">{pageCount}</span>
        {" · "}
        <span className="tabular-nums">{total}</span> تۆمار
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={hrefFor(page - 1)} scroll={false}>
              <ChevronRightIcon />
              پێشوو
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronRightIcon />
            پێشوو
          </Button>
        )}
        {page < pageCount ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={hrefFor(page + 1)} scroll={false}>
              دواتر
              <ChevronLeftIcon />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            دواتر
            <ChevronLeftIcon />
          </Button>
        )}
      </div>
    </nav>
  );
}
