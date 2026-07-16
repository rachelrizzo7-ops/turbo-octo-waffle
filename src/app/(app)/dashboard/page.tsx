import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate, daysUntil, upcomingWindow } from "@/lib/format";
import { StatusBadge } from "@/components/Badge";

export default async function DashboardPage() {
  const [statusCounts, activeAgg, needsReview, pendingApproval, expiringSoon, recent] = await Promise.all([
    prisma.contract.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contract.aggregate({
      where: { status: "APPROVED", lifecycleStatus: "ACTIVE" },
      _sum: { contractValue: true },
      _count: { _all: true },
    }),
    prisma.contract.count({ where: { status: "NEEDS_REVIEW" } }),
    prisma.contract.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.contract.findMany({
      where: {
        lifecycleStatus: "ACTIVE",
        status: "APPROVED",
        expirationDate: upcomingWindow(90),
      },
      orderBy: { expirationDate: "asc" },
      take: 10,
    }),
    prisma.contract.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Intake pipeline and contract portfolio at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Needs Review" value={needsReview} href="/contracts?status=NEEDS_REVIEW" highlight={needsReview > 0} />
        <StatCard label="Pending Approval" value={pendingApproval} href="/contracts?status=PENDING_APPROVAL" highlight={pendingApproval > 0} />
        <StatCard label="Active Contracts" value={activeAgg._count._all} href="/contracts?status=APPROVED" />
        <StatCard label="Active Portfolio Value" value={formatMoney(activeAgg._sum.contractValue)} href="/reports" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Expiring in the next 90 days</h2>
          <div className="mt-4 space-y-3">
            {expiringSoon.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nothing expiring soon.</p>
            )}
            {expiringSoon.map((c) => {
              const days = daysUntil(c.expirationDate);
              return (
                <Link
                  key={c.id}
                  href={`/contracts/${c.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{c.counterparty ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-700 dark:text-slate-300">{formatDate(c.expirationDate)}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">{days} days</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Recently uploaded</h2>
          <div className="mt-4 space-y-3">
            {recent.map((c) => (
              <Link
                key={c.id}
                href={`/contracts/${c.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">#{c.contractNumber} · {formatDate(c.createdAt)}</p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">All statuses</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {(["PROCESSING", "NEEDS_REVIEW", "PENDING_APPROVAL", "APPROVED", "REJECTED", "EXTRACTION_FAILED"] as const).map((s) => (
            <Link
              key={s}
              href={`/contracts?status=${s}`}
              className="rounded-lg border border-slate-200 px-4 py-3 text-center hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{countByStatus[s] ?? 0}</p>
              <StatusBadge status={s} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: string | number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-4 hover:shadow-sm ${
        highlight
          ? "border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
    </Link>
  );
}
