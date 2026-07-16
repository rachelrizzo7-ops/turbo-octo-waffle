"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NewContractPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);

    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);

    const res = await fetch("/api/contracts", { method: "POST", body: formData });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Upload failed.");
      return;
    }
    if (body.warning) {
      setWarning(body.warning);
    }
    router.push(`/contracts/${body.contract.id}`);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Upload a contract</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        The document will be scanned by AI to pre-fill the contract data. You&apos;ll review and confirm it next.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Title (optional — AI will suggest one if left blank)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Document</label>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:file:bg-slate-700"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PDF, Word (.docx), or plain text.</p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {warning && <p className="text-sm text-amber-600 dark:text-amber-400">{warning}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? "Uploading & scanning…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
