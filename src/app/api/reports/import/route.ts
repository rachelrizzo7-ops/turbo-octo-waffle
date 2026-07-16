import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";
import { canImportExcel } from "@/lib/roles";
import { EXCEL_COLUMNS, LIFECYCLE_STATUS_OPTIONS, RAG_STATUS_OPTIONS } from "@/lib/excelSchema";

interface RowError {
  row: number;
  message: string;
}

function cellToString(value: ExcelJS.CellValue): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && "richText" in value) {
    return (value.richText as { text: string }[]).map((t) => t.text).join("");
  }
  if (value instanceof Date) return value.toISOString();
  const str = String(value).trim();
  return str === "" ? null : str;
}

function cellToDate(value: ExcelJS.CellValue): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function cellToNumber(value: ExcelJS.CellValue): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isNaN(num) ? null : num;
}

function cellToBoolean(value: ExcelJS.CellValue): boolean {
  if (value === null || value === undefined) return false;
  const str = String(value).trim().toLowerCase();
  return str === "yes" || str === "true" || str === "1";
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  if (!canImportExcel(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs's bundled Buffer type doesn't structurally match the Buffer type from this
    // project's @types/node version; both are Node Buffers at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
  } catch {
    return NextResponse.json({ error: "Could not read that file as an Excel workbook (.xlsx)." }, { status: 400 });
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return NextResponse.json({ error: "The workbook has no worksheets." }, { status: 400 });
  }

  const headerRow = sheet.getRow(1);
  const headerToColIndex = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const text = cellToString(cell.value);
    if (text) headerToColIndex.set(text, colNumber);
  });

  const missing = EXCEL_COLUMNS.filter((c) => !headerToColIndex.has(c.header));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `This doesn't look like a contracts export — missing columns: ${missing.map((c) => c.header).join(", ")}` },
      { status: 400 },
    );
  }

  const idCol = headerToColIndex.get("Contract ID")!;

  let updated = 0;
  let unchanged = 0;
  const errors: RowError[] = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (row.cellCount === 0) continue;

    const id = cellToString(row.getCell(idCol).value);
    if (!id) continue; // blank row

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      errors.push({ row: rowNumber, message: `No contract found with Contract ID "${id}" — was this row added by hand? Leave that column as exported.` });
      continue;
    }

    const data: Record<string, unknown> = {};
    let rowHasError = false;

    for (const col of EXCEL_COLUMNS) {
      if (!col.editable) continue;
      const colIndex = headerToColIndex.get(col.header)!;
      const rawValue = row.getCell(colIndex).value;

      if (col.key === "lifecycleStatus") {
        const str = cellToString(rawValue);
        if (str && !LIFECYCLE_STATUS_OPTIONS.includes(str.toUpperCase())) {
          errors.push({ row: rowNumber, message: `Status "${str}" is not one of ${LIFECYCLE_STATUS_OPTIONS.join(", ")}` });
          rowHasError = true;
          continue;
        }
        if (str) data.lifecycleStatus = str.toUpperCase();
        continue;
      }

      if (col.key === "ragStatus") {
        const str = cellToString(rawValue)?.toLowerCase() ?? null;
        if (str && !RAG_STATUS_OPTIONS.includes(str)) {
          errors.push({ row: rowNumber, message: `RAG Status "${str}" is not one of ${RAG_STATUS_OPTIONS.join(", ")}` });
          rowHasError = true;
          continue;
        }
        data.ragStatus = str;
        continue;
      }

      if (col.type === "number") {
        data[col.key] = cellToNumber(rawValue);
      } else if (col.type === "date") {
        data[col.key] = cellToDate(rawValue);
      } else if (col.type === "boolean") {
        data[col.key] = cellToBoolean(rawValue);
      } else {
        data[col.key] = cellToString(rawValue);
      }
    }

    if (rowHasError) continue;

    // only persist fields that actually changed, so the audit log + write volume stay meaningful
    const changed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const current = (contract as unknown as Record<string, unknown>)[key];
      const isDate = current instanceof Date || value instanceof Date;
      const same = isDate
        ? new Date(current as string | Date).getTime() === new Date(value as string | Date).getTime()
        : current === value;
      if (!same) changed[key] = value;
    }

    if (Object.keys(changed).length === 0) {
      unchanged++;
      continue;
    }

    await prisma.contract.update({ where: { id }, data: changed });
    await prisma.auditLog.create({
      data: {
        contractId: id,
        userId: user.id,
        action: "BULK_IMPORT_EDIT",
        detail: JSON.stringify({ changedFields: Object.keys(changed) }),
      },
    });
    updated++;
  }

  return NextResponse.json({ updated, unchanged, errors });
}
