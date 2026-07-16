import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, upcomingWindow } from "@/lib/format";
import { canImportExcel } from "@/lib/roles";
import { ExcelImportForm } from "@/components/ExcelImportForm";

export default async function ReportsPage() {
  const session = await auth();
  const role = session!.user.role;

  const [total, active, expiringSoon, valueAgg, byCategory] = await Promise.all([
    prisma.contract.count(),
    prisma.contract.count({ where: { lifecycleStatus: "ACTIVE", status: "APPROVED" } }),
    prisma.contract.count({
      where: {
        lifecycleStatus: "ACTIVE",
        status: "APPROVED",
        expirationDate: upcomingWindow(90),
      },
    }),
    prisma.contract.aggregate({ where: { lifecycleStatus: "ACTIVE", status: "APPROVED" }, _sum: { contractValue: true } }),
    prisma.contract.groupBy({ by: ["category"], _count: { _all: true }, where: { category: { not: null } } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Reports</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Download the full contract data set as Excel, make changes, and upload it back — changes are applied automatically.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total Contracts" value={total} />
        <Stat label="Active" value={active} />
        <Stat label="Expiring in 90 days" value={expiringSoon} />
        <Stat label="Active Portfolio Value" value={formatMoney(valueAgg._sum.contractValue)} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">By category</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {byCategory.map((c) => (
            <span
              key={c.category}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {c.category} <span className="font-semibold">{c._count._all}</span>
            </span>
          ))}
          {byCategory.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No categorized contracts yet.</p>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Download report</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Exports every contract&apos;s coded data to a spreadsheet you can filter, pivot, or edit.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/api/reports/export" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Download all contracts (.xlsx)
          </a>
          <a href="/api/reports/export?lifecycleStatus=ACTIVE" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Active only
          </a>
          <a href="/api/reports/export?status=APPROVED" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Approved only
          </a>
        </div>
      </div>

      {canImportExcel(role) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Upload edited report</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload the same spreadsheet after editing it. Matches are made by the hidden <span className="font-mono">Contract ID</span> column —
            don&apos;t edit or remove that column. Approval status can only be changed from a contract&apos;s review page, not from the spreadsheet.
          </p>
          <div className="mt-4">
            <ExcelImportForm />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}
