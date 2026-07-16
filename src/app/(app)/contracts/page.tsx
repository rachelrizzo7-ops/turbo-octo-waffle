import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge, LifecycleBadge, RagBadge } from "@/components/Badge";
import type { Prisma, ContractStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS: ContractStatus[] = [
  "PROCESSING",
  "NEEDS_REVIEW",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "EXTRACTION_FAILED",
];

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status;
  const q = params.q;

  const where: Prisma.ContractWhereInput = {};
  if (status) where.status = status as ContractStatus;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { counterparty: { contains: q } },
      { contractReferenceNumber: { contains: q } },
    ];
  }

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Contracts</h1>
      </div>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search title, supplier, reference #"
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Filter
        </button>
        {(status || q) && (
          <Link href="/contracts" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <Th>#</Th>
              <Th>Contract</Th>
              <Th>Supplier</Th>
              <Th>Type</Th>
              <Th>Value</Th>
              <Th>End Date</Th>
              <Th>Status</Th>
              <Th>Lifecycle</Th>
              <Th>RAG</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {contracts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{c.contractNumber}</td>
                <td className="px-4 py-3 text-sm">
                  <Link href={`/contracts/${c.id}`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{c.counterparty ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{c.contractType ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{formatMoney(c.contractValue, c.currency)}</td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{formatDate(c.expirationDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3"><LifecycleBadge status={c.lifecycleStatus} /></td>
                <td className="px-4 py-3"><RagBadge status={c.ragStatus} /></td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No contracts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {children}
    </th>
  );
}
