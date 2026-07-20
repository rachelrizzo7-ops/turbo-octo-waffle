import { Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../db";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { estimateAvatarAnchors } from "../services/claude";
import { fileToBase64, mimeTypeFromExt, publicUrlForFile, upload, UPLOAD_DIR } from "../services/storage";

const router = Router();
router.use(requireAuth);

// PUT /avatar — upload/replace the user's full-body selfie used for try-on.
router.put("/", upload.single("photo"), async (req: AuthedRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing photo file (field name: photo)" });
  }

  try {
    const base64 = fileToBase64(req.file.path);
    const mediaType = mimeTypeFromExt(req.file.path);
    const anchors = await estimateAvatarAnchors(base64, mediaType);

    const previous = await prisma.avatar.findUnique({ where: { userId: req.userId! } });

    const avatar = await prisma.avatar.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        imageUrl: publicUrlForFile(req.file.filename),
        torsoAnchor: anchors.torsoAnchor,
        legsAnchor: anchors.legsAnchor,
        feetAnchor: anchors.feetAnchor,
      },
      update: {
        imageUrl: publicUrlForFile(req.file.filename),
        torsoAnchor: anchors.torsoAnchor,
        legsAnchor: anchors.legsAnchor,
        feetAnchor: anchors.feetAnchor,
      },
    });

    if (previous) {
      fs.unlink(path.join(UPLOAD_DIR, path.basename(previous.imageUrl)), () => undefined);
    }

    return res.json(avatar);
  } catch (err) {
    fs.unlink(req.file.path, () => undefined);
    console.error("Failed to process avatar photo:", err);
    return res.status(502).json({ error: "Failed to process avatar photo" });
  }
});

// GET /avatar
router.get("/", async (req: AuthedRequest, res) => {
  const avatar = await prisma.avatar.findUnique({ where: { userId: req.userId! } });
  if (!avatar) return res.status(404).json({ error: "No avatar set up yet" });
  return res.json(avatar);
});

export default router;
