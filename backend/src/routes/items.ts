import { Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../db";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { classifyGarmentImage } from "../services/claude";
import { fileToBase64, mimeTypeFromExt, publicUrlForFile, upload, UPLOAD_DIR } from "../services/storage";
import { TAXONOMY_DIMENSIONS } from "../services/taxonomy";

const router = Router();
router.use(requireAuth);

// POST /items — upload a garment photo, classify it with Claude, persist it.
router.post("/", upload.single("photo"), async (req: AuthedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing photo file (field name: photo)" });
  }

  try {
    const base64 = fileToBase64(req.file.path);
    const mediaType = mimeTypeFromExt(req.file.path);
    const classification = await classifyGarmentImage(base64, mediaType);

    const item = await prisma.closetItem.create({
      data: {
        userId: req.userId!,
        imageUrl: publicUrlForFile(req.file.filename),
        label: classification.label,
        garmentType: classification.garmentType,
        subcategory: classification.subcategory,
        dominantColors: classification.dominantColors,
        notes: classification.notes,
        ...Object.fromEntries(
          TAXONOMY_DIMENSIONS.map((dim) => [dim, classification.tags[dim] ?? []])
        ),
      },
    });

    return res.status(201).json(item);
  } catch (err) {
    // Clean up the orphaned upload if classification/persistence failed.
    fs.unlink(req.file.path, () => undefined);
    console.error("Failed to classify/save closet item:", err);
    return res.status(502).json({ error: "Failed to classify garment photo" });
  }
});

// GET /items — list the current user's closet, newest first.
router.get("/", async (req: AuthedRequest, res) => {
  const items = await prisma.closetItem.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  return res.json(items);
});

// GET /items/:id
router.get("/:id", async (req: AuthedRequest, res) => {
  const item = await prisma.closetItem.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!item) return res.status(404).json({ error: "Item not found" });
  return res.json(item);
});

// DELETE /items/:id
router.delete("/:id", async (req: AuthedRequest, res) => {
  const item = await prisma.closetItem.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!item) return res.status(404).json({ error: "Item not found" });

  await prisma.closetItem.delete({ where: { id: item.id } });

  const filename = path.basename(item.imageUrl);
  fs.unlink(path.join(UPLOAD_DIR, filename), () => undefined);

  return res.status(204).send();
});

export default router;
