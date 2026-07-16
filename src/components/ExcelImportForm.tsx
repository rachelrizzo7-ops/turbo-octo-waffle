"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  updated: number;
  unchanged: number;
  errors: { row: number; message: string }[];
}

export function ExcelImportForm() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("Choose the edited .xlsx file to upload.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/reports/import", { method: "POST", body: formData });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Import failed.");
      return;
    }
    setResult(body);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        ref={fileInput}
        type="file"
        accept=".xlsx"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:file:bg-slate-700"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {loading ? "Uploading…" : "Upload edited spreadsheet"}
      </button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
          <p className="text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{result.updated}</span> contract(s) updated,{" "}
            <span className="font-semibold">{result.unchanged}</span> unchanged.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700 dark:text-red-400">
              {result.errors.map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
