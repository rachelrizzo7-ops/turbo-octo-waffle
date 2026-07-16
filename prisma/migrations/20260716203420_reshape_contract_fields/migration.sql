/*
  Warnings:

  - You are about to drop the column `autoRenew` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `renewalNoticeDays` on the `Contract` table. All the data in the column will be lost.
  - Added the required column `contractNumber` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "lifecycleStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "rawText" TEXT,
    "aiExtractionRaw" TEXT,
    "aiConfidence" TEXT,
    "extractionError" TEXT,
    "title" TEXT NOT NULL,
    "counterparty" TEXT,
    "supplierType" TEXT,
    "contractType" TEXT,
    "category" TEXT,
    "client" TEXT,
    "team" TEXT,
    "internalReference" TEXT,
    "effectiveDate" DATETIME,
    "expirationDate" DATETIME,
    "rollingDaysNotice" INTEGER,
    "noticePeriodDate" DATETIME,
    "autoArchive" BOOLEAN NOT NULL DEFAULT false,
    "contractValue" REAL,
    "currency" TEXT DEFAULT 'USD',
    "billingCycle" TEXT,
    "paymentTerms" TEXT,
    "description" TEXT,
    "ragStatus" TEXT,
    "ragNarrative" TEXT,
    "riskFlags" TEXT,
    "summary" TEXT,
    "internalOwner" TEXT,
    "supplierOwner" TEXT,
    "contractReferenceNumber" TEXT,
    "invoiceNumber" TEXT,
    "quoteNumber" TEXT,
    "clientPO" TEXT,
    "governingLaw" TEXT,
    "keyObligations" TEXT,
    "terminationTerms" TEXT,
    "uploadedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("aiConfidence", "aiExtractionRaw", "approvedAt", "approvedById", "contractType", "contractValue", "counterparty", "createdAt", "currency", "effectiveDate", "expirationDate", "extractionError", "fileName", "filePath", "fileType", "governingLaw", "id", "keyObligations", "paymentTerms", "rawText", "rejectionReason", "reviewedAt", "reviewedById", "riskFlags", "status", "summary", "terminationTerms", "title", "updatedAt", "uploadedById") SELECT "aiConfidence", "aiExtractionRaw", "approvedAt", "approvedById", "contractType", "contractValue", "counterparty", "createdAt", "currency", "effectiveDate", "expirationDate", "extractionError", "fileName", "filePath", "fileType", "governingLaw", "id", "keyObligations", "paymentTerms", "rawText", "rejectionReason", "reviewedAt", "reviewedById", "riskFlags", "status", "summary", "terminationTerms", "title", "updatedAt", "uploadedById" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Contract_lifecycleStatus_idx" ON "Contract"("lifecycleStatus");
CREATE INDEX "Contract_contractType_idx" ON "Contract"("contractType");
CREATE INDEX "Contract_expirationDate_idx" ON "Contract"("expirationDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
