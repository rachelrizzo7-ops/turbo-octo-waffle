import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import { RootStackParamList, MainTabParamList } from "../navigation/types";
import { listSavedOutfits } from "../api/endpoints";
import { resolveImageUrl } from "../api/client";
import { SavedOutfit } from "../types";
import { PrimaryButton, Screen } from "../components/ui";
import { theme } from "../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Outfits">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function OutfitsScreen({ navigation }: Props) {
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      listSavedOutfits()
        .then(setOutfits)
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <Screen>
      <View style={{ padding: theme.spacing(6), paddingBottom: theme.spacing(2) }}>
        <Text style={{ ...theme.font.display, color: theme.color.text }}>Outfits</Text>
        <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(1) }}>
          Saved looks and AI-styled ideas from your closet
        </Text>
      </View>

      <View style={{ paddingHorizontal: theme.spacing(6), marginBottom: theme.spacing(4) }}>
        <PrimaryButton title="Get Outfit Ideas" onPress={() => navigation.navigate("OutfitRecommend")} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.color.accent} />
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: theme.spacing(6), paddingTop: 0, paddingBottom: theme.spacing(24) }}
          ListEmptyComponent={
            <Text style={{ color: theme.color.textMuted, textAlign: "center", marginTop: theme.spacing(10) }}>
              No saved outfits yet.
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.md,
                padding: theme.spacing(4),
                marginBottom: theme.spacing(3),
              }}
            >
              <Text style={{ color: theme.color.text, fontWeight: "700", fontSize: 15 }}>{item.name}</Text>
              {item.stylingNotes && (
                <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(1), fontSize: 13 }}>
                  {item.stylingNotes}
                </Text>
              )}
              <View style={{ flexDirection: "row", marginTop: theme.spacing(3) }}>
                {item.items.map(({ item: garment }) => (
                  <Image
                    key={garment.id}
                    source={{ uri: resolveImageUrl(garment.imageUrl) }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: theme.radius.sm,
                      marginRight: theme.spacing(2),
                      backgroundColor: theme.color.surfaceAlt,
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
