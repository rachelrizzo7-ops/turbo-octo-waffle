import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { recommendOutfits } from "../services/claude";

const router = Router();
router.use(requireAuth);

const recommendSchema = z.object({
  occasion: z.string().optional(),
  weather: z.string().optional(),
  temperatureF: z.number().optional(),
  stylePreference: z.string().optional(),
});

// POST /outfits/recommend — ask Claude to build outfit(s) from the closet.
router.post("/recommend", async (req: AuthedRequest, res) => {
  const parsed = recommendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }

  const items = await prisma.closetItem.findMany({ where: { userId: req.userId! } });
  if (items.length === 0) {
    return res.status(422).json({ error: "Add some closet items before requesting outfit ideas" });
  }

  const closet = items.map((item) => ({
    id: item.id,
    label: item.label,
    garmentType: item.garmentType,
    dominantColors: item.dominantColors,
    tags: {
      sleeveLength: item.sleeveLength,
      season: item.season,
      fabric: item.fabric,
      weight: item.weight,
      fit: item.fit,
      formality: item.formality,
      pattern: item.pattern,
      texture: item.texture,
      construction: item.construction,
      occasion: item.occasion,
      colorTreatment: item.colorTreatment,
    },
  }));

  try {
    const outfits = await recommendOutfits({ ...parsed.data, closet });

    // Resolve item IDs back to full item objects for the client, dropping
    // any hallucinated IDs that don't actually exist in this closet.
    const byId = new Map(items.map((item) => [item.id, item]));
    const resolved = outfits.map((outfit) => ({
      name: outfit.name,
      stylingNotes: outfit.stylingNotes,
      items: outfit.itemIds.map((id) => byId.get(id)).filter((item): item is (typeof items)[number] => Boolean(item)),
    }));

    return res.json({ outfits: resolved });
  } catch (err) {
    console.error("Failed to generate outfit recommendations:", err);
    return res.status(502).json({ error: "Failed to generate outfit recommendations" });
  }
});

const saveOutfitSchema = z.object({
  name: z.string().min(1),
  occasion: z.string().optional(),
  weather: z.string().optional(),
  stylingNotes: z.string().optional(),
  itemIds: z.array(z.string()).min(1),
});

// POST /outfits — save an outfit (e.g. one the user liked from recommendations).
router.post("/", async (req: AuthedRequest, res) => {
  const parsed = saveOutfitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { name, occasion, weather, stylingNotes, itemIds } = parsed.data;

  const ownedCount = await prisma.closetItem.count({
    where: { id: { in: itemIds }, userId: req.userId! },
  });
  if (ownedCount !== itemIds.length) {
    return res.status(400).json({ error: "One or more items don't belong to this user" });
  }

  const outfit = await prisma.outfit.create({
    data: {
      userId: req.userId!,
      name,
      occasion,
      weather,
      stylingNotes,
      items: { create: itemIds.map((itemId) => ({ itemId })) },
    },
    include: { items: { include: { item: true } } },
  });

  return res.status(201).json(outfit);
});

// GET /outfits — list saved outfits.
router.get("/", async (req: AuthedRequest, res) => {
  const outfits = await prisma.outfit.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { item: true } } },
  });
  return res.json(outfits);
});

export default router;
