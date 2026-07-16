"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@/generated/prisma/client";
import { canUpload, canManageUsers, ROLE_LABELS } from "@/lib/roles";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contracts", label: "Contracts" },
  { href: "/reports", label: "Reports" },
] as const;

export function AppShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="flex w-56 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 px-2">
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Contract Manager
          </span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {canUpload(user.role) && (
            <Link
              href="/contracts/new"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === "/contracts/new"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Upload contract
            </Link>
          )}
          {canManageUsers(user.role) && (
            <Link
              href="/admin/users"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname.startsWith("/admin")
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Manage users
            </Link>
          )}
        </nav>
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
            {user.name ?? user.email}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {ROLE_LABELS[user.role]}
          </p>
          <button
            onClick={() => signOut({ redirect: false }).then(() => router.push("/login"))}
            className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
