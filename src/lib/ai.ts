import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
const MAX_CHARS = 150_000; // keep extraction cost/latency bounded for very large contracts

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to your .env file to enable AI extraction.",
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface ExtractedContractFields {
  title: string | null;
  counterparty: string | null;
  contractType: string | null;
  category: string | null;
  effectiveDate: string | null; // ISO date, YYYY-MM-DD
  expirationDate: string | null; // ISO date, YYYY-MM-DD
  rollingDaysNotice: number | null;
  contractValue: number | null;
  currency: string | null;
  billingCycle: string | null;
  paymentTerms: string | null;
  description: string | null;
  governingLaw: string | null;
  keyObligations: string | null;
  terminationTerms: string | null;
  supplierOwner: string | null;
  contractReferenceNumber: string | null;
  summary: string | null;
  riskFlags: string[];
  ragStatus: "red" | "amber" | "green" | null;
  ragNarrative: string | null;
  fieldConfidence: Record<string, "high" | "medium" | "low">;
}

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: "record_contract_fields",
  description:
    "Records structured data extracted from a contract document for intake into a contract management system.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: ["string", "null"], description: "A short descriptive name for the contract" },
      counterparty: { type: ["string", "null"], description: "Name of the supplier / other party to the contract" },
      contractType: {
        type: ["string", "null"],
        description: "The category of document, e.g. Signed Quote, Schedule, Signed Order Form, MSA, NDA, SOW, Lease, Amendment",
      },
      category: {
        type: ["string", "null"],
        description: "Business category of what's being purchased, e.g. SaaS/Subscription, Hardware/Software, Cloud/Hosting, Security/Cyber Security, Network, Operations, Professional Services",
      },
      effectiveDate: { type: ["string", "null"], description: "Effective/start date in YYYY-MM-DD format" },
      expirationDate: { type: ["string", "null"], description: "Expiration/end date in YYYY-MM-DD format" },
      rollingDaysNotice: { type: ["integer", "null"], description: "Number of days notice required prior to renewal/expiration to terminate or prevent auto-renewal, if stated" },
      contractValue: { type: ["number", "null"], description: "Total or annual contract value as a plain number, no currency symbols" },
      currency: { type: ["string", "null"], description: "3-letter currency code, e.g. USD" },
      billingCycle: { type: ["string", "null"], description: "Billing/payment frequency, e.g. Annual, Quarterly, Monthly, Prepaid, One-time" },
      paymentTerms: { type: ["string", "null"], description: "Brief description of payment terms (e.g. Net 30)" },
      description: { type: ["string", "null"], description: "One-sentence factual description of what the contract covers" },
      governingLaw: { type: ["string", "null"], description: "Governing law / jurisdiction" },
      keyObligations: { type: ["string", "null"], description: "Brief summary of each party's key obligations" },
      terminationTerms: { type: ["string", "null"], description: "Brief summary of termination conditions" },
      supplierOwner: { type: ["string", "null"], description: "Named contact person for the supplier/counterparty, if listed" },
      contractReferenceNumber: { type: ["string", "null"], description: "Any contract/reference number printed on the document itself" },
      summary: { type: ["string", "null"], description: "2-3 sentence plain-English summary of the contract" },
      riskFlags: {
        type: "array",
        items: { type: "string" },
        description: "Notable risks or unusual terms a human reviewer should double check (e.g. uncapped liability, missing indemnification, auto-renewal with short notice window). Empty array if none.",
      },
      ragStatus: {
        type: ["string", "null"],
        enum: ["red", "amber", "green", null],
        description: "Suggested Red/Amber/Green risk rating for this contract based on the risk flags found: red = serious concerns, amber = some concerns worth a look, green = no notable concerns.",
      },
      ragNarrative: { type: ["string", "null"], description: "1-2 sentence explanation supporting the suggested RAG status" },
      fieldConfidence: {
        type: "object",
        description: "Confidence level ('high', 'medium', or 'low') for each of the above fields you were able to extract, keyed by field name. Mark 'low' for anything guessed or ambiguous.",
        additionalProperties: { type: "string", enum: ["high", "medium", "low"] },
      },
    },
    required: [
      "title",
      "counterparty",
      "contractType",
      "category",
      "effectiveDate",
      "expirationDate",
      "rollingDaysNotice",
      "contractValue",
      "currency",
      "billingCycle",
      "paymentTerms",
      "description",
      "governingLaw",
      "keyObligations",
      "terminationTerms",
      "supplierOwner",
      "contractReferenceNumber",
      "summary",
      "riskFlags",
      "ragStatus",
      "ragNarrative",
      "fieldConfidence",
    ],
  },
};

export async function extractContractFields(
  documentText: string,
): Promise<{ fields: ExtractedContractFields; rawResponse: string }> {
  const truncated = documentText.slice(0, MAX_CHARS);

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "record_contract_fields" },
    messages: [
      {
        role: "user",
        content: `Read the following contract document and extract structured intake data using the record_contract_fields tool. If a field cannot be determined from the text, use null rather than guessing. Dates must be in YYYY-MM-DD format.\n\n<document>\n${truncated}\n</document>`,
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );

  if (!toolUse) {
    throw new Error("AI extraction did not return structured data.");
  }

  return {
    fields: toolUse.input as ExtractedContractFields,
    rawResponse: JSON.stringify(response),
  };
}
