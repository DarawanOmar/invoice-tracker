"use client";

import { HistoryIcon, ReceiptTextIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Tab = "invoices" | "jobs";

export function HistoryTabs({
  invoiceCount,
  jobCount,
  invoices,
  jobs,
}: {
  invoiceCount: number;
  jobCount: number;
  invoices: React.ReactNode;
  jobs: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "jobs" ? "jobs" : "invoices";

  function onTabChange(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === "jobs") params.set("tab", "jobs");
    else params.delete("tab");
    const search = params.toString();
    // Next.js keeps useSearchParams in sync with replaceState.
    window.history.replaceState(null, "", search ? `${pathname}?${search}` : pathname);
  }

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="gap-4">
      <TabsList className="h-10! w-full sm:w-fit">
        <TabsTrigger value="invoices" className="px-4">
          <ReceiptTextIcon />
          پسوڵەکان
          <Badge variant="secondary" className="tabular-nums">
            {invoiceCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="jobs" className="px-4">
          <HistoryIcon />
          تۆماری چاپکردن
          <Badge variant="secondary" className="tabular-nums">
            {jobCount}
          </Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="invoices" className="flex flex-col gap-3">
        {invoices}
      </TabsContent>
      <TabsContent value="jobs" className="flex flex-col gap-3">
        {jobs}
      </TabsContent>
    </Tabs>
  );
}
