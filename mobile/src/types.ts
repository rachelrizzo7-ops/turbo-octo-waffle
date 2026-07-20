import { TaxonomyDimension } from "./taxonomy";

export interface User {
  id: string;
  email: string;
}

export interface ClosetItem {
  id: string;
  userId: string;
  imageUrl: string;
  label: string;
  garmentType: string;
  subcategory: string | null;
  dominantColors: string[];
  notes: string | null;
  createdAt: string;
  sleeveLength: string[];
  season: string[];
  fabric: string[];
  weight: string[];
  fit: string[];
  formality: string[];
  pattern: string[];
  texture: string[];
  construction: string[];
  occasion: string[];
  colorTreatment: string[];
}

export type ClosetItemTags = Pick<ClosetItem, TaxonomyDimension>;

export interface Avatar {
  id: string;
  userId: string;
  imageUrl: string;
  torsoAnchor: AnchorBox;
  legsAnchor: AnchorBox;
  feetAnchor: AnchorBox;
}

export interface AnchorBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecommendedOutfit {
  name: string;
  stylingNotes: string;
  items: ClosetItem[];
}

export interface SavedOutfit {
  id: string;
  name: string;
  occasion: string | null;
  weather: string | null;
  stylingNotes: string | null;
  createdAt: string;
  items: { item: ClosetItem }[];
}
