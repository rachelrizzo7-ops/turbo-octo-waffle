import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";
import { canApprove } from "@/lib/roles";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;
  if (!canApprove(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (contract.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: `Cannot approve a contract with status ${contract.status}` }, { status: 400 });
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: { status: "APPROVED", approvedById: user.id, approvedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { contractId: id, userId: user.id, action: "APPROVED" },
  });

  return NextResponse.json({ contract: updated });
}
