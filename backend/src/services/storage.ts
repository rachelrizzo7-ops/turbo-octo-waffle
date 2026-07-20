import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuid } from "uuid";

export const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = ALLOWED_MIME[file.mimetype] ?? "bin";
      cb(null, `${uuid()}.${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) {
      cb(new Error("Unsupported image type. Use JPEG, PNG, or WebP."));
      return;
    }
    cb(null, true);
  },
});

export function fileToBase64(filePath: string): string {
  return fs.readFileSync(filePath).toString("base64");
}

export function mimeTypeFromExt(filePath: string): "image/jpeg" | "image/png" | "image/webp" {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export function publicUrlForFile(filename: string): string {
  return `/uploads/${filename}`;
}
