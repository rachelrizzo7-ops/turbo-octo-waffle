import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";
import { canUpload } from "@/lib/roles";
import { saveUploadedFile } from "@/lib/storage";
import { extractText } from "@/lib/extractText";
import { extractContractFields } from "@/lib/ai";
import { nextContractNumber, computeNoticePeriodDate } from "@/lib/contractFields";
import type { Prisma } from "@/generated/prisma/client";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const contractType = searchParams.get("contractType");
  const q = searchParams.get("q");

  const where: Prisma.ContractWhereInput = {};
  if (status) where.status = status as Prisma.ContractWhereInput["status"];
  if (contractType) where.contractType = contractType;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { counterparty: { contains: q } },
    ];
  }

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ contracts });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;

  if (!canUpload(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const titleOverride = formData.get("title");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filePath = await saveUploadedFile(buffer, file.name);
  const contractNumber = await nextContractNumber();

  const contract = await prisma.contract.create({
    data: {
      contractNumber,
      title: typeof titleOverride === "string" && titleOverride ? titleOverride : file.name,
      status: "PROCESSING",
      fileName: file.name,
      filePath,
      fileType: file.type || "application/octet-stream",
      uploadedById: user.id,
    },
  });

  await prisma.auditLog.create({
    data: { contractId: contract.id, userId: user.id, action: "UPLOADED", detail: JSON.stringify({ fileName: file.name }) },
  });

  let extractedText: string | null = null;
  try {
    extractedText = await extractText(buffer, contract.fileType);
    const { fields, rawResponse } = await extractContractFields(extractedText);
    const text = extractedText;

    const expirationDate = parseDate(fields.expirationDate);
    const noticePeriodDate = computeNoticePeriodDate(expirationDate, fields.rollingDaysNotice);

    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: "NEEDS_REVIEW",
        title: fields.title ?? contract.title,
        rawText: text.slice(0, 500_000),
        aiExtractionRaw: rawResponse,
        aiConfidence: JSON.stringify(fields.fieldConfidence ?? {}),
        counterparty: fields.counterparty,
        contractType: fields.contractType,
        category: fields.category,
        effectiveDate: parseDate(fields.effectiveDate),
        expirationDate,
        rollingDaysNotice: fields.rollingDaysNotice,
        noticePeriodDate,
        contractValue: fields.contractValue,
        currency: fields.currency ?? "USD",
        billingCycle: fields.billingCycle,
        paymentTerms: fields.paymentTerms,
        description: fields.description,
        governingLaw: fields.governingLaw,
        keyObligations: fields.keyObligations,
        terminationTerms: fields.terminationTerms,
        supplierOwner: fields.supplierOwner,
        contractReferenceNumber: fields.contractReferenceNumber,
        riskFlags: JSON.stringify(fields.riskFlags ?? []),
        ragStatus: fields.ragStatus,
        ragNarrative: fields.ragNarrative,
        summary: fields.summary,
      },
    });

    await prisma.auditLog.create({
      data: { contractId: contract.id, action: "AI_EXTRACTED", detail: JSON.stringify({ riskFlagCount: fields.riskFlags?.length ?? 0 }) },
    });

    return NextResponse.json({ contract: updated }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown extraction error";
    const failed = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: "EXTRACTION_FAILED",
        extractionError: message,
        rawText: extractedText ? extractedText.slice(0, 500_000) : null,
      },
    });
    await prisma.auditLog.create({
      data: { contractId: contract.id, action: "AI_EXTRACTION_FAILED", detail: JSON.stringify({ error: message }) },
    });
    return NextResponse.json({ contract: failed, warning: `AI extraction failed: ${message}` }, { status: 201 });
  }
}
