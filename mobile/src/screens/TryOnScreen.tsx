import React, { useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { getAvatar } from "../api/endpoints";
import { resolveImageUrl } from "../api/client";
import { Avatar, AnchorBox, ClosetItem } from "../types";
import { PrimaryButton, Screen } from "../components/ui";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "TryOn">;

function pct(n: number): `${number}%` {
  return `${Math.round(n * 1000) / 10}%`;
}

function unionBox(a: AnchorBox, b: AnchorBox): AnchorBox {
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x: Math.min(a.x, b.x), y: top, width: Math.max(a.x + a.width, b.x + b.width) - Math.min(a.x, b.x), height: bottom - top };
}

function boxFor(item: ClosetItem, avatar: Avatar): AnchorBox {
  switch (item.garmentType) {
    case "dress":
      return unionBox(avatar.torsoAnchor, avatar.legsAnchor);
    case "bottom":
      return avatar.legsAnchor;
    case "footwear":
      return avatar.feetAnchor;
    case "top":
    case "outerwear":
    default:
      return avatar.torsoAnchor;
  }
}

// Render order so outerwear layers visually over tops, etc.
const LAYER_ORDER: Record<string, number> = {
  dress: 0,
  bottom: 1,
  top: 2,
  outerwear: 3,
  footwear: 4,
  accessory: 5,
};

export default function TryOnScreen({ route, navigation }: Props) {
  const { outfit } = route.params;
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvatar().then((a) => {
      setAvatar(a);
      setLoading(false);
      if (a) {
        Image.getSize(
          resolveImageUrl(a.imageUrl),
          (width, height) => setImageSize({ width, height }),
          () => setImageSize({ width: 3, height: 4 })
        );
      }
    });
  }, []);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: theme.spacing(20) }} color={theme.color.accent} />
      </Screen>
    );
  }

  if (!avatar) {
    return (
      <Screen>
        <View style={{ padding: theme.spacing(6), flex: 1, justifyContent: "center" }}>
          <Text style={{ color: theme.color.text, ...theme.font.title, marginBottom: theme.spacing(3) }}>
            Set up your avatar first
          </Text>
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
            Take a full-body photo so outfits can be previewed on you.
          </Text>
          <PrimaryButton title="Set Up Avatar" onPress={() => navigation.navigate("AvatarSetup")} />
        </View>
      </Screen>
    );
  }

  const layered = [...outfit.items].sort(
    (a, b) => (LAYER_ORDER[a.garmentType] ?? 9) - (LAYER_ORDER[b.garmentType] ?? 9)
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(6) }}>
        <Text style={{ ...theme.font.title, color: theme.color.text, marginBottom: theme.spacing(1) }}>
          {outfit.name}
        </Text>
        <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(4), fontSize: 12 }}>
          Approximate preview — items are layered onto your photo using estimated body regions,
          not a precise fit render.
        </Text>

        <View
          style={{
            width: "100%",
            aspectRatio: imageSize ? imageSize.width / imageSize.height : 0.75,
            borderRadius: theme.radius.lg,
            overflow: "hidden",
            backgroundColor: theme.color.surface,
          }}
        >
          <Image
            source={{ uri: resolveImageUrl(avatar.imageUrl) }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          {layered
            .filter((item) => item.garmentType !== "accessory")
            .map((item) => {
              const box = boxFor(item, avatar);
              return (
                <Image
                  key={item.id}
                  source={{ uri: resolveImageUrl(item.imageUrl) }}
                  resizeMode="contain"
                  style={{
                    position: "absolute",
                    left: pct(box.x),
                    top: pct(box.y),
                    width: pct(box.width),
                    height: pct(box.height),
                  }}
                />
              );
            })}
        </View>

        {outfit.items.some((i) => i.garmentType === "accessory") && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: theme.spacing(4) }}>
            {outfit.items
              .filter((i) => i.garmentType === "accessory")
              .map((item) => (
                <Image
                  key={item.id}
                  source={{ uri: resolveImageUrl(item.imageUrl) }}
                  style={{ width: 44, height: 44, borderRadius: theme.radius.sm, marginRight: theme.spacing(2) }}
                />
              ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
