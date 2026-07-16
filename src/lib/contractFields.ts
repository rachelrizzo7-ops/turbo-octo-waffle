import { prisma } from "@/lib/prisma";

/** Assigns the next friendly sequential contract number (best-effort; fine for single-writer/internal-tool scale). */
export async function nextContractNumber(): Promise<number> {
  const max = await prisma.contract.aggregate({ _max: { contractNumber: true } });
  return (max._max.contractNumber ?? 0) + 1;
}

/** Notice-by date = expiration date minus the rolling notice window, when both are known. */
export function computeNoticePeriodDate(
  expirationDate: Date | null,
  rollingDaysNotice: number | null,
): Date | null {
  if (!expirationDate || !rollingDaysNotice) return null;
  const d = new Date(expirationDate);
  d.setDate(d.getDate() - rollingDaysNotice);
  return d;
}
