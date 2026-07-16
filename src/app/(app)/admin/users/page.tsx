import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/UsersTable";

export default async function AdminUsersPage() {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  const users = rows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Manage users</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add teammates and set their role.
        </p>
      </div>
      <UsersTable initialUsers={users} />
    </div>
  );
}
