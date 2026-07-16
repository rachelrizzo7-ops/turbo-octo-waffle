import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";
import { resolveStoredFilePath } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await params;

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const buffer = await fs.readFile(resolveStoredFilePath(contract.filePath));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contract.fileType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${contract.fileName.replace(/"/g, "")}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}
