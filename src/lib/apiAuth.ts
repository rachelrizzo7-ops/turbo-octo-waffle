import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Role } from "@/generated/prisma/client";

/** Resolves the current session for API routes, or returns a 401 response to send instead. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user: session.user, response: null };
}

export function requireRole(role: Role, allowed: (role: Role) => boolean) {
  if (!allowed(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
