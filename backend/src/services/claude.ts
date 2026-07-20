import Anthropic from "@anthropic-ai/sdk";
import { GARMENT_TYPES, TAXONOMY, TaxonomyDimension } from "./taxonomy";

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic({ apiKey });
}

function taxonomyProperties(): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const dimension of Object.keys(TAXONOMY) as TaxonomyDimension[]) {
    props[dimension] = {
      type: "array",
      items: { type: "string", enum: TAXONOMY[dimension] as unknown as string[] },
      description: `Applicable "${dimension}" tags for this garment. Empty array if none apply.`,
    };
  }
  return props;
}

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: "classify_garment",
  description:
    "Record structured attributes describing a single clothing item photographed by the user.",
  input_schema: {
    type: "object",
    properties: {
      label: {
        type: "string",
        description: 'Short human-readable name, e.g. "Navy Cotton Oxford Shirt".',
      },
      garmentType: {
        type: "string",
        enum: GARMENT_TYPES as unknown as string[],
        description: "Broad category needed for outfit-building and try-on placement.",
      },
      subcategory: {
        type: "string",
        description: 'More specific type, e.g. "sneaker", "blazer", "jeans".',
      },
      dominantColors: {
        type: "array",
        items: { type: "string" },
        description: "1-3 dominant color names, e.g. [\"navy\", \"white\"].",
      },
      ...taxonomyProperties(),
      notes: {
        type: "string",
        description: "Any other notable detail (brand text, closures, embellishments). Optional.",
      },
    },
    required: ["label", "garmentType", "dominantColors", ...Object.keys(TAXONOMY)],
  },
};

export interface ClassificationResult {
  label: string;
  garmentType: string;
  subcategory: string | null;
  dominantColors: string[];
  notes: string | null;
  tags: Record<TaxonomyDimension, string[]>;
}

/**
 * Classifies a single garment photo against the closet taxonomy using
 * Claude's vision + forced tool-use so the response is structured JSON
 * rather than free text.
 */
export async function classifyGarmentImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<ClassificationResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "classify_garment" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text:
              "This is a photo of a single clothing item from someone's closet, taken " +
              "for a wardrobe inventory app. Call classify_garment with your best-effort " +
              "tags for every taxonomy dimension. Use an empty array for a dimension that " +
              "genuinely doesn't apply to this garment type (e.g. sleeveLength for shoes).",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude did not return a classify_garment tool call");
  }

  const input = toolUse.input as Record<string, unknown>;
  const tags = {} as Record<TaxonomyDimension, string[]>;
  for (const dimension of Object.keys(TAXONOMY) as TaxonomyDimension[]) {
    const value = input[dimension];
    tags[dimension] = Array.isArray(value) ? (value as string[]) : [];
  }

  return {
    label: String(input.label ?? "Unlabeled item"),
    garmentType: String(input.garmentType ?? "accessory"),
    subcategory: input.subcategory ? String(input.subcategory) : null,
    dominantColors: Array.isArray(input.dominantColors)
      ? (input.dominantColors as string[])
      : [],
    notes: input.notes ? String(input.notes) : null,
    tags,
  };
}

export interface AvatarAnchors {
  torsoAnchor: { x: number; y: number; width: number; height: number };
  legsAnchor: { x: number; y: number; width: number; height: number };
  feetAnchor: { x: number; y: number; width: number; height: number };
}

const DEFAULT_ANCHORS: AvatarAnchors = {
  torsoAnchor: { x: 0.2, y: 0.22, width: 0.6, height: 0.33 },
  legsAnchor: { x: 0.22, y: 0.55, width: 0.56, height: 0.35 },
  feetAnchor: { x: 0.25, y: 0.9, width: 0.5, height: 0.08 },
};

const ANCHOR_BOX_SCHEMA = {
  type: "object",
  properties: {
    x: { type: "number", description: "Left edge, normalized 0-1 of image width." },
    y: { type: "number", description: "Top edge, normalized 0-1 of image height." },
    width: { type: "number", description: "Box width, normalized 0-1 of image width." },
    height: { type: "number", description: "Box height, normalized 0-1 of image height." },
  },
  required: ["x", "y", "width", "height"],
} as const;

const ANCHOR_TOOL: Anthropic.Tool = {
  name: "record_body_anchors",
  description:
    "Record approximate normalized bounding boxes for the torso, legs, and feet in a full-body photo, for use as clothing-overlay anchor points.",
  input_schema: {
    type: "object",
    properties: {
      torsoAnchor: ANCHOR_BOX_SCHEMA,
      legsAnchor: ANCHOR_BOX_SCHEMA,
      feetAnchor: ANCHOR_BOX_SCHEMA,
    },
    required: ["torsoAnchor", "legsAnchor", "feetAnchor"],
  },
};

/**
 * Estimates rough torso/legs/feet regions in a full-body selfie so the
 * mobile app can position layered clothing-item cutouts for the try-on
 * preview. This is an approximation, not pixel-level segmentation — if
 * Claude's estimate looks off, the app falls back to centered defaults
 * and the user can still preview outfits, just less precisely aligned.
 */
export async function estimateAvatarAnchors(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<AvatarAnchors> {
  const client = getClient();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      tools: [ANCHOR_TOOL],
      tool_choice: { type: "tool", name: "record_body_anchors" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            {
              type: "text",
              text:
                "This is a full-body selfie for a wardrobe app's avatar/try-on feature. " +
                "Call record_body_anchors with your best estimate of the torso, legs, and " +
                "feet regions as normalized bounding boxes.",
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    if (!toolUse) return DEFAULT_ANCHORS;
    return toolUse.input as unknown as AvatarAnchors;
  } catch (err) {
    console.error("Falling back to default avatar anchors:", err);
    return DEFAULT_ANCHORS;
  }
}

export interface RecommendationRequest {
  occasion?: string;
  weather?: string;
  temperatureF?: number;
  stylePreference?: string;
  closet: Array<{
    id: string;
    label: string;
    garmentType: string;
    dominantColors: string[];
    tags: Record<string, string[]>;
  }>;
}

export interface RecommendedOutfit {
  name: string;
  itemIds: string[];
  stylingNotes: string;
}

const RECOMMEND_TOOL: Anthropic.Tool = {
  name: "recommend_outfits",
  description: "Propose one or more outfits built entirely from the user's existing closet items.",
  input_schema: {
    type: "object",
    properties: {
      outfits: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: 'Short outfit name, e.g. "Rainy Day Office Look".' },
            itemIds: {
              type: "array",
              items: { type: "string" },
              description: "IDs of closet items in this outfit, taken verbatim from the provided closet list.",
            },
            stylingNotes: {
              type: "string",
              description: "1-3 sentences on why this works and how to wear it.",
            },
          },
          required: ["name", "itemIds", "stylingNotes"],
        },
      },
    },
    required: ["outfits"],
  },
};

/**
 * Asks Claude to compose outfit(s) strictly from the user's own closet
 * inventory, given occasion/weather context.
 */
export async function recommendOutfits(
  req: RecommendationRequest
): Promise<RecommendedOutfit[]> {
  const client = getClient();

  const contextLines = [
    req.occasion ? `Occasion: ${req.occasion}` : null,
    req.weather ? `Weather: ${req.weather}` : null,
    typeof req.temperatureF === "number" ? `Temperature: ${req.temperatureF}°F` : null,
    req.stylePreference ? `Style preference: ${req.stylePreference}` : null,
  ].filter(Boolean);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1536,
    tools: [RECOMMEND_TOOL],
    tool_choice: { type: "tool", name: "recommend_outfits" },
    messages: [
      {
        role: "user",
        content:
          "You are a personal stylist. Using ONLY the items in the closet JSON below " +
          "(reference them by their exact \"id\" field), propose 1-3 complete, weather- " +
          "and occasion-appropriate outfits. Each outfit should generally include a " +
          "top+bottom or a dress, plus outerwear/footwear when suitable ones exist. " +
          "Do not invent items that aren't in the list.\n\n" +
          (contextLines.length ? contextLines.join("\n") + "\n\n" : "") +
          `Closet:\n${JSON.stringify(req.closet, null, 2)}`,
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude did not return a recommend_outfits tool call");
  }

  const input = toolUse.input as { outfits?: RecommendedOutfit[] };
  return input.outfits ?? [];
}
