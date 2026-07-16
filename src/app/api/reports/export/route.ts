import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";
import { EXCEL_COLUMNS, LIFECYCLE_STATUS_OPTIONS, RAG_STATUS_OPTIONS } from "@/lib/excelSchema";
import type { Prisma, ContractStatus } from "@/generated/prisma/client";

const APPROVAL_LABELS: Record<ContractStatus, string> = {
  PROCESSING: "Processing",
  NEEDS_REVIEW: "Needs Review",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXTRACTION_FAILED: "Extraction Failed",
};

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const lifecycleStatus = searchParams.get("lifecycleStatus");

  const where: Prisma.ContractWhereInput = {};
  if (status) where.status = status as ContractStatus;
  if (lifecycleStatus) where.lifecycleStatus = lifecycleStatus as Prisma.ContractWhereInput["lifecycleStatus"];

  const contracts = await prisma.contract.findMany({ where, orderBy: { contractNumber: "asc" } });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Contracts");

  sheet.columns = EXCEL_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16 }));
  sheet.getRow(1).font = { bold: true };

  for (const c of contracts) {
    sheet.addRow({
      id: c.id,
      contractNumber: c.contractNumber,
      title: c.title,
      counterparty: c.counterparty,
      supplierType: c.supplierType,
      currency: c.currency,
      contractValue: c.contractValue,
      lifecycleStatus: c.lifecycleStatus,
      approvalDisplay: APPROVAL_LABELS[c.status],
      contractType: c.contractType,
      category: c.category,
      client: c.client,
      team: c.team,
      internalReference: c.internalReference,
      effectiveDate: c.effectiveDate,
      expirationDate: c.expirationDate,
      noticePeriodDate: c.noticePeriodDate,
      rollingDaysNotice: c.rollingDaysNotice,
      autoArchive: c.autoArchive ? "Yes" : "No",
      description: c.description,
      ragStatus: c.ragStatus,
      ragNarrative: c.ragNarrative,
      internalOwner: c.internalOwner,
      supplierOwner: c.supplierOwner,
      contractReferenceNumber: c.contractReferenceNumber,
      invoiceNumber: c.invoiceNumber,
      quoteNumber: c.quoteNumber,
      clientPO: c.clientPO,
      billingCycle: c.billingCycle,
      paymentTerms: c.paymentTerms,
      governingLaw: c.governingLaw,
      keyObligations: c.keyObligations,
      terminationTerms: c.terminationTerms,
      summary: c.summary,
    });
  }

  const dateColumns = EXCEL_COLUMNS.filter((c) => c.type === "date").map((c) =>
    sheet.getColumn(c.key),
  );
  for (const col of dateColumns) {
    col.numFmt = "yyyy-mm-dd";
  }

  const lastRow = contracts.length + 1;
  for (let r = 2; r <= lastRow; r++) {
    sheet.getCell(`${sheet.getColumn("lifecycleStatus").letter}${r}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${LIFECYCLE_STATUS_OPTIONS.join(",")}"`],
    };
    sheet.getCell(`${sheet.getColumn("ragStatus").letter}${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${RAG_STATUS_OPTIONS.join(",")}"`],
    };
  }

  // lock down the non-editable columns visually so it's clear they shouldn't be changed
  sheet.getColumn("id").font = { color: { argb: "FF94A3B8" }, italic: true };
  sheet.getColumn("contractNumber").font = { color: { argb: "FF94A3B8" }, italic: true };
  sheet.getColumn("approvalDisplay").font = { color: { argb: "FF94A3B8" }, italic: true };
  sheet.getColumn("summary").font = { color: { argb: "FF94A3B8" }, italic: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `contracts-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
