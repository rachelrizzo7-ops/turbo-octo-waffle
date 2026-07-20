import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { removeBackground } from "@imgly/background-removal-node";
import { UPLOAD_DIR, publicUrlForFile } from "./storage";

/**
 * Produces a transparent-background PNG cutout of an uploaded garment
 * photo, for clean layering onto the avatar in the try-on preview.
 * Runs a local segmentation model (no external API call). Returns null
 * on failure so callers can fall back to the original photo instead of
 * failing the whole item upload over a cosmetic step.
 */
export async function removeGarmentBackground(sourcePath: string): Promise<string | null> {
  try {
    const blob = await removeBackground(sourcePath, {
      model: "small",
      output: { format: "image/png", quality: 0.9 },
    });
    const buffer = Buffer.from(await blob.arrayBuffer());
    const filename = `${uuid()}-cutout.png`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
    return publicUrlForFile(filename);
  } catch (err) {
    console.error("Background removal failed, falling back to original photo:", err);
    return null;
  }
}
