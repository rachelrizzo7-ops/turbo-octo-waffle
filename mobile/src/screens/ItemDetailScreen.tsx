import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { resolveImageUrl } from "../api/client";
import { deleteClosetItem } from "../api/endpoints";
import { Chip, Screen, SecondaryButton } from "../components/ui";
import { theme } from "../theme";
import { DIMENSION_LABELS, TAXONOMY_DIMENSIONS } from "../taxonomy";

type Props = NativeStackScreenProps<RootStackParamList, "ItemDetail">;

export default function ItemDetailScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    Alert.alert("Remove item?", `Delete "${item.label}" from your closet.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          await deleteClosetItem(item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing(12) }}>
        <Image source={{ uri: resolveImageUrl(item.imageUrl) }} style={{ width: "100%", aspectRatio: 1 }} />
        <View style={{ padding: theme.spacing(6) }}>
          <Text style={{ ...theme.font.title, color: theme.color.text }}>{item.label}</Text>
          <Text style={{ color: theme.color.textMuted, textTransform: "capitalize", marginTop: 2 }}>
            {item.garmentType}
            {item.subcategory ? ` · ${item.subcategory}` : ""}
          </Text>

          {item.dominantColors.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: theme.spacing(4) }}>
              {item.dominantColors.map((c) => (
                <Chip key={c} label={c} />
              ))}
            </View>
          )}

          {TAXONOMY_DIMENSIONS.map((dim) => {
            const values = item[dim];
            if (!values || values.length === 0) return null;
            return (
              <View key={dim} style={{ marginTop: theme.spacing(5) }}>
                <Text
                  style={{
                    ...theme.font.label,
                    color: theme.color.textMuted,
                    textTransform: "uppercase",
                    marginBottom: theme.spacing(2),
                  }}
                >
                  {DIMENSION_LABELS[dim]}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {values.map((v) => (
                    <Chip key={v} label={v} />
                  ))}
                </View>
              </View>
            );
          })}

          {item.notes && (
            <View style={{ marginTop: theme.spacing(5) }}>
              <Text style={{ ...theme.font.label, color: theme.color.textMuted, textTransform: "uppercase" }}>
                Notes
              </Text>
              <Text style={{ color: theme.color.text, marginTop: theme.spacing(2) }}>{item.notes}</Text>
            </View>
          )}

          <View style={{ marginTop: theme.spacing(8) }}>
            <SecondaryButton title={deleting ? "Removing…" : "Remove from closet"} onPress={confirmDelete} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
