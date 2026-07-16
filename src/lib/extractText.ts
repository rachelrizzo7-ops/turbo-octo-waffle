import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/** Pulls plain text out of an uploaded contract file so it can be sent to the AI extractor. */
export async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  const type = fileType.toLowerCase();

  if (type.includes("pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (
    type.includes("wordprocessingml") ||
    type.includes("msword") ||
    type.includes("docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // plain text / fallback
  return buffer.toString("utf-8");
}
