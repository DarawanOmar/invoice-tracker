import type { Metadata } from "next";

import { HistoryTabs } from "@/components/history/history-tabs";
import { InvoicesTable } from "@/components/history/invoices-table";
import { PaginationLinks } from "@/components/history/pagination-links";
import { PrintJobsTable } from "@/components/history/print-jobs-table";
import { RangeReprintButton } from "@/components/history/range-reprint-button";
import { StatsCards } from "@/components/history/stats-cards";
import { PageHeader } from "@/components/page-header";
import { getStats, listInvoices, listPrintJobs } from "@/lib/data";

export const metadata: Metadata = { title: "مێژووی چاپکردن" };

function toPage(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export default async function HistoryPage(props: PageProps<"/history">) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q : "";

  const [stats, invoices, jobs] = await Promise.all([
    getStats(),
    listInvoices({ query, page: toPage(searchParams.page) }),
    listPrintJobs({ page: toPage(searchParams.jobsPage) }),
  ]);

  const params = Object.fromEntries(
    Object.entries(searchParams).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="مێژووی چاپکردن"
        description="هەموو پسوڵە پاشەکەوتکراوەکان، ژمارەی جارەکانی چاپکردنیان، و تۆماری هەر جارێکی چاپکردن."
        actions={<RangeReprintButton />}
      />
      <StatsCards stats={stats} />
      <HistoryTabs
        invoiceCount={invoices.total}
        jobCount={jobs.total}
        invoices={
          <>
            <InvoicesTable invoices={invoices.items} query={query} />
            <PaginationLinks
              param="page"
              page={invoices.page}
              pageCount={invoices.pageCount}
              total={invoices.total}
              searchParams={params}
            />
          </>
        }
        jobs={
          <>
            <PrintJobsTable jobs={jobs.items} />
            <PaginationLinks
              param="jobsPage"
              page={jobs.page}
              pageCount={jobs.pageCount}
              total={jobs.total}
              searchParams={{ ...params, tab: "jobs" }}
            />
          </>
        }
      />
    </div>
  );
}
