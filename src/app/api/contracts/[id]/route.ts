import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";
import { canEditFields } from "@/lib/roles";
import { computeNoticePeriodDate } from "@/lib/contractFields";

function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined; // not provided, leave unchanged
  if (value === null || value === "") return null;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

const EDITABLE_STRING_FIELDS = [
  "title",
  "counterparty",
  "supplierType",
  "contractType",
  "category",
  "client",
  "team",
  "internalReference",
  "currency",
  "billingCycle",
  "paymentTerms",
  "description",
  "governingLaw",
  "keyObligations",
  "terminationTerms",
  "ragStatus",
  "ragNarrative",
  "summary",
  "internalOwner",
  "supplierOwner",
  "contractReferenceNumber",
  "invoiceNumber",
  "quoteNumber",
  "clientPO",
] as const;

const EDITABLE_ENUM_FIELDS = ["lifecycleStatus"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ contract });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await params;

  if (!canEditFields(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const action = body.action as string | undefined;

  if (action === "submit_for_approval") {
    if (contract.status !== "NEEDS_REVIEW" && contract.status !== "REJECTED" && contract.status !== "EXTRACTION_FAILED") {
      return NextResponse.json({ error: `Cannot submit a contract with status ${contract.status}` }, { status: 400 });
    }
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        status: "PENDING_APPROVAL",
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });
    await prisma.auditLog.create({
      data: { contractId: id, userId: user.id, action: "SUBMITTED_FOR_APPROVAL" },
    });
    return NextResponse.json({ contract: updated });
  }

  // default: edit coded fields
  const fields = body.fields ?? {};
  const data: Record<string, unknown> = {};

  for (const key of EDITABLE_STRING_FIELDS) {
    if (key in fields) data[key] = fields[key] === "" ? null : fields[key];
  }
  for (const key of EDITABLE_ENUM_FIELDS) {
    if (key in fields) data[key] = fields[key];
  }
  if ("effectiveDate" in fields) data.effectiveDate = parseDate(fields.effectiveDate);
  if ("expirationDate" in fields) data.expirationDate = parseDate(fields.expirationDate);
  if ("noticePeriodDate" in fields) data.noticePeriodDate = parseDate(fields.noticePeriodDate);
  if ("autoArchive" in fields) data.autoArchive = Boolean(fields.autoArchive);
  if ("rollingDaysNotice" in fields) {
    data.rollingDaysNotice = fields.rollingDaysNotice === "" || fields.rollingDaysNotice === null ? null : Number(fields.rollingDaysNotice);
  }
  if ("contractValue" in fields) {
    data.contractValue = fields.contractValue === "" || fields.contractValue === null ? null : Number(fields.contractValue);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  }

  // keep the notice-by date in sync when either input changes and the caller didn't set it explicitly
  if (!("noticePeriodDate" in data) && ("expirationDate" in data || "rollingDaysNotice" in data)) {
    const expirationDate = (data.expirationDate as Date | null | undefined) ?? contract.expirationDate;
    const rollingDaysNotice = (data.rollingDaysNotice as number | null | undefined) ?? contract.rollingDaysNotice;
    data.noticePeriodDate = computeNoticePeriodDate(expirationDate, rollingDaysNotice);
  }

  const updated = await prisma.contract.update({ where: { id }, data });
  await prisma.auditLog.create({
    data: { contractId: id, userId: user.id, action: "FIELDS_EDITED", detail: JSON.stringify(Object.keys(data)) },
  });

  return NextResponse.json({ contract: updated });
}
