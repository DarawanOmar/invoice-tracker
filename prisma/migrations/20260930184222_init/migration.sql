-- CreateEnum
CREATE TYPE "PrintMode" AS ENUM ('SINGLE', 'MULTIPLE', 'RANGE', 'REPRINT');

-- CreateEnum
CREATE TYPE "PaperSize" AS ENUM ('A5', 'A4');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "recipientName" TEXT,
    "amountIqd" DECIMAL(15,2),
    "amountUsd" DECIMAL(15,2),
    "amountInWords" TEXT,
    "purpose" TEXT,
    "remainingIqd" DECIMAL(15,2),
    "remainingUsd" DECIMAL(15,2),
    "printCount" INTEGER NOT NULL DEFAULT 0,
    "lastPrintedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintJob" (
    "id" TEXT NOT NULL,
    "mode" "PrintMode" NOT NULL,
    "paperSize" "PaperSize" NOT NULL DEFAULT 'A5',
    "copies" INTEGER NOT NULL DEFAULT 1,
    "invoiceCount" INTEGER NOT NULL,
    "totalPrints" INTEGER NOT NULL,
    "fromNumber" INTEGER,
    "toNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintJobItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,

    CONSTRAINT "PrintJobItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "PrintJob_createdAt_idx" ON "PrintJob"("createdAt");

-- CreateIndex
CREATE INDEX "PrintJobItem_invoiceId_idx" ON "PrintJobItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PrintJobItem_jobId_invoiceId_key" ON "PrintJobItem"("jobId", "invoiceId");

-- AddForeignKey
ALTER TABLE "PrintJobItem" ADD CONSTRAINT "PrintJobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PrintJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintJobItem" ADD CONSTRAINT "PrintJobItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
