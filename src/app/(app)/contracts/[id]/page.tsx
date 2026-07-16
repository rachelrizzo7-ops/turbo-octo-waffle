import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ContractReviewForm } from "@/components/ContractReviewForm";
import { StatusBadge, LifecycleBadge } from "@/components/Badge";
import { formatDate } from "@/lib/format";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
      auditLogs: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
    },
  });

  if (!contract) notFound();

  const fieldConfidence: Record<string, string> = contract.aiConfidence
    ? JSON.parse(contract.aiConfidence)
    : {};
  const isPdf = contract.fileType.toLowerCase().includes("pdf");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{contract.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Contract #{contract.contractNumber} · Uploaded by {contract.uploadedBy.name} on {formatDate(contract.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={contract.status} />
          <LifecycleBadge status={contract.lifecycleStatus} />
        </div>
      </div>

      {contract.status === "PROCESSING" && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
          AI extraction is still running. Refresh in a moment.
        </div>
      )}
      {contract.status === "EXTRACTION_FAILED" && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          AI extraction failed: {contract.extractionError}. You can fill in the fields manually below and submit for approval.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Original document</h2>
            <a
              href={`/api/contracts/${contract.id}/file`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Open / download
            </a>
          </div>
          <div className="h-[75vh] overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {isPdf ? (
              <iframe src={`/api/contracts/${contract.id}/file`} className="h-full w-full" title={contract.fileName} />
            ) : (
              <pre className="h-full overflow-y-auto whitespace-pre-wrap p-4 text-xs text-slate-700 dark:text-slate-300">
                {contract.rawText || "No preview available for this file type."}
              </pre>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Activity</h2>
            <ul className="mt-3 space-y-2">
              {contract.auditLogs.map((log) => (
                <li key={log.id} className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{log.action.replaceAll("_", " ")}</span>
                  {log.user?.name ? ` — ${log.user.name}` : ""} · {formatDate(log.createdAt)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <ContractReviewForm contract={contract} role={session!.user.role} fieldConfidence={fieldConfidence} />
        </div>
      </div>
    </div>
  );
}
