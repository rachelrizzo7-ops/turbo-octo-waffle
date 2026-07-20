import { ClosetItem, RecommendedOutfit } from "../types";

export type RootStackParamList = {
  Main: undefined;
  AddItem: undefined;
  ItemDetail: { item: ClosetItem };
  AvatarSetup: undefined;
  OutfitRecommend: undefined;
  TryOn: { outfit: RecommendedOutfit };
};

export type MainTabParamList = {
  Closet: undefined;
  Outfits: undefined;
  Avatar: undefined;
};
