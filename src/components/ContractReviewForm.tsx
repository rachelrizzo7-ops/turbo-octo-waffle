"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Contract, Role } from "@/generated/prisma/client";
import { canEditFields, canApprove } from "@/lib/roles";
import { formatDateInput } from "@/lib/format";

type FormState = {
  title: string;
  counterparty: string;
  supplierType: string;
  contractType: string;
  category: string;
  client: string;
  team: string;
  internalReference: string;
  effectiveDate: string;
  expirationDate: string;
  rollingDaysNotice: string;
  autoArchive: boolean;
  contractValue: string;
  currency: string;
  billingCycle: string;
  paymentTerms: string;
  description: string;
  ragStatus: string;
  ragNarrative: string;
  summary: string;
  internalOwner: string;
  supplierOwner: string;
  contractReferenceNumber: string;
  invoiceNumber: string;
  quoteNumber: string;
  clientPO: string;
  governingLaw: string;
  keyObligations: string;
  terminationTerms: string;
  lifecycleStatus: string;
};

function toFormState(contract: Contract): FormState {
  return {
    title: contract.title ?? "",
    counterparty: contract.counterparty ?? "",
    supplierType: contract.supplierType ?? "",
    contractType: contract.contractType ?? "",
    category: contract.category ?? "",
    client: contract.client ?? "",
    team: contract.team ?? "",
    internalReference: contract.internalReference ?? "",
    effectiveDate: formatDateInput(contract.effectiveDate),
    expirationDate: formatDateInput(contract.expirationDate),
    rollingDaysNotice: contract.rollingDaysNotice?.toString() ?? "",
    autoArchive: contract.autoArchive,
    contractValue: contract.contractValue?.toString() ?? "",
    currency: contract.currency ?? "USD",
    billingCycle: contract.billingCycle ?? "",
    paymentTerms: contract.paymentTerms ?? "",
    description: contract.description ?? "",
    ragStatus: contract.ragStatus ?? "",
    ragNarrative: contract.ragNarrative ?? "",
    summary: contract.summary ?? "",
    internalOwner: contract.internalOwner ?? "",
    supplierOwner: contract.supplierOwner ?? "",
    contractReferenceNumber: contract.contractReferenceNumber ?? "",
    invoiceNumber: contract.invoiceNumber ?? "",
    quoteNumber: contract.quoteNumber ?? "",
    clientPO: contract.clientPO ?? "",
    governingLaw: contract.governingLaw ?? "",
    keyObligations: contract.keyObligations ?? "",
    terminationTerms: contract.terminationTerms ?? "",
    lifecycleStatus: contract.lifecycleStatus,
  };
}

export function ContractReviewForm({
  contract,
  role,
  fieldConfidence,
}: {
  contract: Contract;
  role: Role;
  fieldConfidence: Record<string, string>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(contract));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const editable = canEditFields(role);
  const approver = canApprove(role);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(extra?: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/contracts/${contract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          ...form,
          rollingDaysNotice: form.rollingDaysNotice,
          contractValue: form.contractValue,
        },
        ...extra,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function submitForApproval() {
    const ok = await save();
    if (!ok) return;
    setSaving(true);
    const res = await fetch(`/api/contracts/${contract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit_for_approval" }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to submit.");
      return;
    }
    router.refresh();
  }

  async function approve() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/contracts/${contract.id}/approve`, { method: "POST" });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to approve.");
      return;
    }
    router.refresh();
  }

  async function reject() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/contracts/${contract.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to reject.");
      return;
    }
    setShowReject(false);
    router.refresh();
  }

  const canSubmit = editable && ["NEEDS_REVIEW", "REJECTED", "EXTRACTION_FAILED"].includes(contract.status);
  const canDecide = approver && contract.status === "PENDING_APPROVAL";

  return (
    <div className="space-y-6">
      {contract.riskFlags && JSON.parse(contract.riskFlags).length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">AI-flagged items to double check</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800 dark:text-amber-300">
            {(JSON.parse(contract.riskFlags) as string[]).map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {contract.rejectionReason && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <strong>Rejected:</strong> {contract.rejectionReason}
        </div>
      )}

      <Section title="Identity">
        <Field label="Title" confidence={fieldConfidence.title}>
          <input className={inputCls} disabled={!editable} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Supplier / Counterparty" confidence={fieldConfidence.counterparty}>
          <input className={inputCls} disabled={!editable} value={form.counterparty} onChange={(e) => set("counterparty", e.target.value)} />
        </Field>
        <Field label="Supplier Type">
          <input className={inputCls} disabled={!editable} value={form.supplierType} onChange={(e) => set("supplierType", e.target.value)} />
        </Field>
        <Field label="Contract Type" confidence={fieldConfidence.contractType}>
          <input className={inputCls} disabled={!editable} value={form.contractType} onChange={(e) => set("contractType", e.target.value)} />
        </Field>
        <Field label="Category" confidence={fieldConfidence.category}>
          <input className={inputCls} disabled={!editable} value={form.category} onChange={(e) => set("category", e.target.value)} />
        </Field>
        <Field label="Client">
          <input className={inputCls} disabled={!editable} value={form.client} onChange={(e) => set("client", e.target.value)} />
        </Field>
        <Field label="Team">
          <input className={inputCls} disabled={!editable} value={form.team} onChange={(e) => set("team", e.target.value)} />
        </Field>
        <Field label="Internal Reference">
          <input className={inputCls} disabled={!editable} value={form.internalReference} onChange={(e) => set("internalReference", e.target.value)} />
        </Field>
      </Section>

      <Section title="Dates & Renewal">
        <Field label="Start Date" confidence={fieldConfidence.effectiveDate}>
          <input type="date" className={inputCls} disabled={!editable} value={form.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
        </Field>
        <Field label="End Date" confidence={fieldConfidence.expirationDate}>
          <input type="date" className={inputCls} disabled={!editable} value={form.expirationDate} onChange={(e) => set("expirationDate", e.target.value)} />
        </Field>
        <Field label="Rolling Days Notice" confidence={fieldConfidence.rollingDaysNotice}>
          <input type="number" className={inputCls} disabled={!editable} value={form.rollingDaysNotice} onChange={(e) => set("rollingDaysNotice", e.target.value)} />
        </Field>
        <Field label="Auto-Archive on expiration">
          <input type="checkbox" disabled={!editable} checked={form.autoArchive} onChange={(e) => set("autoArchive", e.target.checked)} className="h-4 w-4" />
        </Field>
      </Section>

      <Section title="Financials">
        <Field label="Annual Value" confidence={fieldConfidence.contractValue}>
          <input type="number" className={inputCls} disabled={!editable} value={form.contractValue} onChange={(e) => set("contractValue", e.target.value)} />
        </Field>
        <Field label="Currency">
          <input className={inputCls} disabled={!editable} value={form.currency} onChange={(e) => set("currency", e.target.value)} />
        </Field>
        <Field label="Billing Cycle" confidence={fieldConfidence.billingCycle}>
          <input className={inputCls} disabled={!editable} value={form.billingCycle} onChange={(e) => set("billingCycle", e.target.value)} />
        </Field>
        <Field label="Payment Terms" confidence={fieldConfidence.paymentTerms}>
          <input className={inputCls} disabled={!editable} value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
        </Field>
      </Section>

      <Section title="Risk & Summary">
        <Field label="RAG Status">
          <select className={inputCls} disabled={!editable} value={form.ragStatus} onChange={(e) => set("ragStatus", e.target.value)}>
            <option value="">—</option>
            <option value="green">Green</option>
            <option value="amber">Amber</option>
            <option value="red">Red</option>
          </select>
        </Field>
        <Field label="RAG Narrative" full>
          <textarea className={inputCls} rows={2} disabled={!editable} value={form.ragNarrative} onChange={(e) => set("ragNarrative", e.target.value)} />
        </Field>
        <Field label="Description" full>
          <textarea className={inputCls} rows={2} disabled={!editable} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="AI Summary" full>
          <textarea className={inputCls} rows={3} disabled={!editable} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
        </Field>
      </Section>

      <Section title="Ownership & References">
        <Field label="Internal Owner">
          <input className={inputCls} disabled={!editable} value={form.internalOwner} onChange={(e) => set("internalOwner", e.target.value)} />
        </Field>
        <Field label="Supplier Owner" confidence={fieldConfidence.supplierOwner}>
          <input className={inputCls} disabled={!editable} value={form.supplierOwner} onChange={(e) => set("supplierOwner", e.target.value)} />
        </Field>
        <Field label="Contract Reference #" confidence={fieldConfidence.contractReferenceNumber}>
          <input className={inputCls} disabled={!editable} value={form.contractReferenceNumber} onChange={(e) => set("contractReferenceNumber", e.target.value)} />
        </Field>
        <Field label="Invoice Number">
          <input className={inputCls} disabled={!editable} value={form.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} />
        </Field>
        <Field label="Quote Number">
          <input className={inputCls} disabled={!editable} value={form.quoteNumber} onChange={(e) => set("quoteNumber", e.target.value)} />
        </Field>
        <Field label="Client PO">
          <input className={inputCls} disabled={!editable} value={form.clientPO} onChange={(e) => set("clientPO", e.target.value)} />
        </Field>
      </Section>

      <Section title="Legal">
        <Field label="Governing Law" confidence={fieldConfidence.governingLaw}>
          <input className={inputCls} disabled={!editable} value={form.governingLaw} onChange={(e) => set("governingLaw", e.target.value)} />
        </Field>
        <Field label="Key Obligations" full confidence={fieldConfidence.keyObligations}>
          <textarea className={inputCls} rows={3} disabled={!editable} value={form.keyObligations} onChange={(e) => set("keyObligations", e.target.value)} />
        </Field>
        <Field label="Termination Terms" full confidence={fieldConfidence.terminationTerms}>
          <textarea className={inputCls} rows={3} disabled={!editable} value={form.terminationTerms} onChange={(e) => set("terminationTerms", e.target.value)} />
        </Field>
      </Section>

      {contract.status === "APPROVED" && (
        <Section title="Lifecycle">
          <Field label="Status">
            <select className={inputCls} disabled={!editable} value={form.lifecycleStatus} onChange={(e) => set("lifecycleStatus", e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </Field>
        </Section>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        {editable && (
          <button
            onClick={() => save()}
            disabled={saving}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Save changes
          </button>
        )}
        {canSubmit && (
          <button
            onClick={submitForApproval}
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            Submit for Approval
          </button>
        )}
        {canDecide && (
          <>
            <button
              onClick={approve}
              disabled={saving}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              onClick={() => setShowReject((s) => !s)}
              disabled={saving}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
            >
              Reject
            </button>
          </>
        )}
      </div>

      {showReject && (
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reason for rejection</label>
          <textarea
            className={inputCls + " mt-1"}
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <button
            onClick={reject}
            disabled={saving}
            className="mt-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
          >
            Confirm rejection
          </button>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900 dark:disabled:text-slate-500";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
  confidence,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  confidence?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {confidence === "low" && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            AI: low confidence
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
