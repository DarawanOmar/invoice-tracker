/**
 * Deletes all invoices and print history and restarts invoice numbering.
 * The tables themselves are kept.
 *
 *   pnpm db:reset         asks for confirmation first
 *   pnpm db:reset --yes   no question (for scripts)
 */
import "dotenv/config";

import { createInterface } from "node:readline/promises";

import { PrismaNeon } from "@prisma/adapter-neon";

import { FIRST_INVOICE_NUMBER } from "../lib/company";
import { PrismaClient } from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set (see .env.example).");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function confirmed() {
  if (process.argv.includes("--yes")) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Type "reset" to delete everything: ');
  rl.close();
  return answer.trim().toLowerCase() === "reset";
}

async function main() {
  const host = new URL(connectionString!).host;
  const [invoices, jobs] = await Promise.all([prisma.invoice.count(), prisma.printJob.count()]);

  console.log(`Database: ${host}`);
  console.log(`This permanently deletes ${invoices} invoice(s) and ${jobs} print job(s).`);
  console.log(`The next invoice will be No. ${FIRST_INVOICE_NUMBER}.`);

  if (!(await confirmed())) {
    console.log("Cancelled — nothing was deleted.");
    return;
  }

  await prisma.$transaction([
    prisma.printJobItem.deleteMany(),
    prisma.printJob.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.invoiceCounter.deleteMany(),
  ]);

  console.log("Done — the database is empty.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
