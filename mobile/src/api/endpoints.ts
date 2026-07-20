import { api } from "./client";
import { Avatar, ClosetItem, RecommendedOutfit, SavedOutfit, User } from "../types";

export interface ImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

function toFormData(field: string, asset: ImageAsset): FormData {
  const form = new FormData();
  const filename = asset.fileName || `${field}.jpg`;
  const type = asset.mimeType || "image/jpeg";
  // React Native's FormData accepts this {uri, name, type} shape directly.
  form.append(field, { uri: asset.uri, name: filename, type } as unknown as Blob);
  return form;
}

export async function signup(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: User }>("/auth/signup", { email, password });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
  return data;
}

export async function uploadClosetItem(asset: ImageAsset): Promise<ClosetItem> {
  const { data } = await api.post<ClosetItem>("/items", toFormData("photo", asset), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listClosetItems(): Promise<ClosetItem[]> {
  const { data } = await api.get<ClosetItem[]>("/items");
  return data;
}

export async function deleteClosetItem(id: string): Promise<void> {
  await api.delete(`/items/${id}`);
}

export async function uploadAvatar(asset: ImageAsset): Promise<Avatar> {
  const { data } = await api.put<Avatar>("/avatar", toFormData("photo", asset), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getAvatar(): Promise<Avatar | null> {
  try {
    const { data } = await api.get<Avatar>("/avatar");
    return data;
  } catch {
    return null;
  }
}

export interface RecommendationParams {
  occasion?: string;
  weather?: string;
  temperatureF?: number;
  stylePreference?: string;
}

export async function recommendOutfits(params: RecommendationParams): Promise<RecommendedOutfit[]> {
  const { data } = await api.post<{ outfits: RecommendedOutfit[] }>("/outfits/recommend", params);
  return data.outfits;
}

export async function saveOutfit(input: {
  name: string;
  occasion?: string;
  weather?: string;
  stylingNotes?: string;
  itemIds: string[];
}): Promise<SavedOutfit> {
  const { data } = await api.post<SavedOutfit>("/outfits", input);
  return data;
}

export async function listSavedOutfits(): Promise<SavedOutfit[]> {
  const { data } = await api.get<SavedOutfit[]>("/outfits");
  return data;
}
