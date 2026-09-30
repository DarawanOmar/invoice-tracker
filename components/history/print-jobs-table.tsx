import { HistoryIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { PRINT_MODE_LABELS, type PrintJobView } from "@/lib/invoice";
import { cn } from "@/lib/utils";

function JobNumbers({ job }: { job: PrintJobView }) {
  const isContinuous =
    job.fromNumber !== null &&
    job.toNumber !== null &&
    job.toNumber - job.fromNumber + 1 === job.invoiceCount;

  if (job.invoiceCount === 1 && job.fromNumber !== null) {
    return <span dir="ltr">No. {job.fromNumber}</span>;
  }
  if (isContinuous || (job.mode === "REPRINT" && job.fromNumber !== null)) {
    return (
      <span dir="ltr">
        {job.fromNumber} – {job.toNumber}
      </span>
    );
  }
  if (job.numbers.length === 0) return <span className="text-muted-foreground">سڕاونەتەوە</span>;
  const more = job.invoiceCount - job.numbers.length;
  return (
    <span>
      <span dir="ltr">{job.numbers.join(", ")}</span>
      {more > 0 && <span className="text-muted-foreground"> و {more} ی تر</span>}
    </span>
  );
}

export function PrintJobsTable({ jobs }: { jobs: PrintJobView[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HistoryIcon />
            </EmptyMedia>
            <EmptyTitle>هێشتا هیچ چاپکردنێک تۆمار نەکراوە</EmptyTitle>
            <EmptyDescription>هەر جارێک دوگمەی چاپکردن دادەگیرێت، لێرە تۆمار دەکرێت.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="ps-4">کات</TableHead>
            <TableHead>جۆر</TableHead>
            <TableHead>ژمارەی پسوڵەکان</TableHead>
            <TableHead>پسوڵە</TableHead>
            <TableHead>کۆپی</TableHead>
            <TableHead>کاغەز</TableHead>
            <TableHead className="pe-4">کۆی پەڕە</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="ps-4 whitespace-nowrap tabular-nums">
                <span dir="ltr">{formatDateTime(job.createdAt)}</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(job.mode === "REPRINT" && "border-transparent bg-accent text-accent-foreground")}
                >
                  {PRINT_MODE_LABELS[job.mode]}
                </Badge>
              </TableCell>
              <TableCell className="max-w-72 truncate font-medium tabular-nums">
                <JobNumbers job={job} />
              </TableCell>
              <TableCell className="tabular-nums">{job.invoiceCount}</TableCell>
              <TableCell className="tabular-nums">{job.copies}</TableCell>
              <TableCell>{job.paperSize}</TableCell>
              <TableCell className="pe-4 font-semibold tabular-nums">{job.totalPrints}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
