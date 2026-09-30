import type { Metadata } from "next";
import { connection } from "next/server";

import { PageHeader } from "@/components/page-header";
import { PrintWorkspace } from "@/components/print/print-workspace";
import { getNextInvoiceNumber } from "@/lib/data";
import { toLocalDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "چاپکردنی پسوڵە" };

export default async function PrintPage() {
  await connection();
  const nextNumber = await getNextInvoiceNumber();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="چاپکردنی پسوڵە"
        description="زانیارییەکان بنووسە، پێشبینینەکە بپشکنە، پاشان چاپی بکە. هەموو پسوڵەیەکی چاپکراو لە بنکەدراوەدا پاشەکەوت دەکرێت."
      />
      <PrintWorkspace nextNumber={nextNumber} serverNow={toLocalDateTime()} />
    </div>
  );
}
