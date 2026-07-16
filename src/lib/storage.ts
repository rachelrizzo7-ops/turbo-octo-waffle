import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

const UPLOAD_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads");

/** Saves an uploaded file to local disk under a random, non-guessable name and returns its stored path. */
export async function saveUploadedFile(
  buffer: Buffer,
  originalFileName: string,
): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(originalFileName);
  const storedName = `${randomUUID()}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, storedName);
  await fs.writeFile(fullPath, buffer);
  // store path relative to project root so it stays portable
  return path.join("data", "uploads", storedName);
}

export function resolveStoredFilePath(relativePath: string): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);
}
