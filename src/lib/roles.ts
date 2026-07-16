import type { Role } from "@/generated/prisma/client";

export const ROLES: Role[] = ["ADMIN", "APPROVER", "INTAKE", "VIEWER"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  APPROVER: "Approver",
  INTAKE: "Intake",
  VIEWER: "Viewer",
};

/** Admin and Intake can upload new contracts. */
export function canUpload(role: Role) {
  return role === "ADMIN" || role === "INTAKE";
}

/** Admin, Approver, and Intake can edit the AI-extracted coded fields. */
export function canEditFields(role: Role) {
  return role === "ADMIN" || role === "APPROVER" || role === "INTAKE";
}

/** Only Admin and Approver can approve/reject a contract. */
export function canApprove(role: Role) {
  return role === "ADMIN" || role === "APPROVER";
}

/** Admin, Approver, Intake can run the Excel export/import round-trip. Viewer can only export. */
export function canImportExcel(role: Role) {
  return role === "ADMIN" || role === "APPROVER" || role === "INTAKE";
}

export function canManageUsers(role: Role) {
  return role === "ADMIN";
}
