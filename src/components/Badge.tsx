import type { ContractStatus, LifecycleStatus } from "@/generated/prisma/client";

const STATUS_STYLES: Record<ContractStatus, string> = {
  PROCESSING: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  NEEDS_REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  PENDING_APPROVAL: "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300",
  EXTRACTION_FAILED: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300",
};

const STATUS_LABELS: Record<ContractStatus, string> = {
  PROCESSING: "Processing",
  NEEDS_REVIEW: "Needs Review",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXTRACTION_FAILED: "Extraction Failed",
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const LIFECYCLE_STYLES: Record<LifecycleStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
  ARCHIVED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  TERMINATED: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300",
};

export function LifecycleBadge({ status }: { status: LifecycleStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LIFECYCLE_STYLES[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

const RAG_STYLES: Record<string, string> = {
  red: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export function RagBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-slate-400 dark:text-slate-500">—</span>;
  const style = RAG_STYLES[status.toLowerCase()] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  );
}
