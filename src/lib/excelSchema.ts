/**
 * Single source of truth for the columns in the contract Excel export/import.
 * Export writes these columns in this order; import matches by header text and
 * only writes back columns marked editable — everything else is context for the
 * person editing the sheet but is ignored (or double-checked) on the way back in.
 */
export type ColumnType = "string" | "number" | "boolean" | "date" | "text";

export interface ExcelColumn {
  header: string;
  key: string;
  type: ColumnType;
  editable: boolean;
  width?: number;
}

export const EXCEL_COLUMNS: ExcelColumn[] = [
  { header: "Contract ID", key: "id", type: "string", editable: false, width: 26 },
  { header: "Contract Number", key: "contractNumber", type: "number", editable: false, width: 14 },
  { header: "Contract Name", key: "title", type: "string", editable: true, width: 32 },
  { header: "Supplier Name", key: "counterparty", type: "string", editable: true, width: 24 },
  { header: "Supplier Type", key: "supplierType", type: "string", editable: true, width: 16 },
  { header: "Currency", key: "currency", type: "string", editable: true, width: 10 },
  { header: "Annual Value", key: "contractValue", type: "number", editable: true, width: 14 },
  { header: "Status", key: "lifecycleStatus", type: "string", editable: true, width: 14 },
  { header: "Approval", key: "approvalDisplay", type: "string", editable: false, width: 16 },
  { header: "Contract Type", key: "contractType", type: "string", editable: true, width: 18 },
  { header: "Category", key: "category", type: "string", editable: true, width: 20 },
  { header: "Client", key: "client", type: "string", editable: true, width: 18 },
  { header: "Team", key: "team", type: "string", editable: true, width: 16 },
  { header: "Internal Reference", key: "internalReference", type: "string", editable: true, width: 18 },
  { header: "Start Date", key: "effectiveDate", type: "date", editable: true, width: 14 },
  { header: "End Date", key: "expirationDate", type: "date", editable: true, width: 14 },
  { header: "Notice Period Date", key: "noticePeriodDate", type: "date", editable: true, width: 16 },
  { header: "Rolling Days Notice", key: "rollingDaysNotice", type: "number", editable: true, width: 16 },
  { header: "Auto-Archive", key: "autoArchive", type: "boolean", editable: true, width: 12 },
  { header: "Description", key: "description", type: "text", editable: true, width: 30 },
  { header: "RAG Status", key: "ragStatus", type: "string", editable: true, width: 12 },
  { header: "RAG Narrative", key: "ragNarrative", type: "text", editable: true, width: 30 },
  { header: "Internal Owner", key: "internalOwner", type: "string", editable: true, width: 18 },
  { header: "Supplier Owner", key: "supplierOwner", type: "string", editable: true, width: 18 },
  { header: "Contract Reference #", key: "contractReferenceNumber", type: "string", editable: true, width: 18 },
  { header: "Invoice Number", key: "invoiceNumber", type: "string", editable: true, width: 16 },
  { header: "Quote Number", key: "quoteNumber", type: "string", editable: true, width: 16 },
  { header: "Client PO", key: "clientPO", type: "string", editable: true, width: 16 },
  { header: "Billing Cycle", key: "billingCycle", type: "string", editable: true, width: 14 },
  { header: "Payment Terms", key: "paymentTerms", type: "string", editable: true, width: 20 },
  { header: "Governing Law", key: "governingLaw", type: "string", editable: true, width: 18 },
  { header: "Key Obligations", key: "keyObligations", type: "text", editable: true, width: 34 },
  { header: "Termination Terms", key: "terminationTerms", type: "text", editable: true, width: 34 },
  { header: "AI Summary", key: "summary", type: "text", editable: false, width: 34 },
];

export const LIFECYCLE_STATUS_OPTIONS = ["ACTIVE", "ARCHIVED", "TERMINATED"];
export const RAG_STATUS_OPTIONS = ["red", "amber", "green"];
