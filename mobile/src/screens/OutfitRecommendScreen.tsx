import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { recommendOutfits, saveOutfit } from "../api/endpoints";
import { apiErrorMessage, resolveImageUrl } from "../api/client";
import { RecommendedOutfit } from "../types";
import { ErrorText, Field, PrimaryButton, Screen, SecondaryButton } from "../components/ui";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "OutfitRecommend">;

export default function OutfitRecommendScreen({ navigation }: Props) {
  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [stylePreference, setStylePreference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RecommendedOutfit[] | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const outfits = await recommendOutfits({
        occasion: occasion || undefined,
        weather: weather || undefined,
        stylePreference: stylePreference || undefined,
      });
      setResults(outfits);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't generate outfit ideas. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (outfit: RecommendedOutfit, index: number) => {
    await saveOutfit({
      name: outfit.name,
      occasion: occasion || undefined,
      weather: weather || undefined,
      stylingNotes: outfit.stylingNotes,
      itemIds: outfit.items.map((i) => i.id),
    });
    setSavedIndex(index);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: theme.spacing(6), paddingBottom: theme.spacing(16) }}>
        <Text style={{ ...theme.font.title, color: theme.color.text, marginBottom: theme.spacing(4) }}>
          What are you dressing for?
        </Text>

        <Field label="Occasion" placeholder="e.g. client dinner, weekend errands" value={occasion} onChangeText={setOccasion} />
        <Field label="Weather" placeholder="e.g. cold and rainy, 60°F and sunny" value={weather} onChangeText={setWeather} />
        <Field label="Style preference (optional)" placeholder="e.g. keep it minimal" value={stylePreference} onChangeText={setStylePreference} />

        <PrimaryButton title="Get Ideas" onPress={submit} loading={loading} disabled={loading} />
        <ErrorText>{error}</ErrorText>

        {results?.length === 0 && (
          <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(6) }}>
            Nothing quite fit that brief with your current closet — try loosening the ask.
          </Text>
        )}

        {results?.map((outfit, index) => (
          <View
            key={`${outfit.name}-${index}`}
            style={{
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.md,
              padding: theme.spacing(4),
              marginTop: theme.spacing(5),
            }}
          >
            <Text style={{ color: theme.color.text, fontWeight: "700", fontSize: 16 }}>{outfit.name}</Text>
            <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(1.5), fontSize: 13, lineHeight: 18 }}>
              {outfit.stylingNotes}
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: theme.spacing(3) }}>
              {outfit.items.map((item) => (
                <Image
                  key={item.id}
                  source={{ uri: resolveImageUrl(item.imageUrl) }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: theme.radius.sm,
                    marginRight: theme.spacing(2),
                    marginBottom: theme.spacing(2),
                    backgroundColor: theme.color.surfaceAlt,
                  }}
                />
              ))}
            </View>

            <PrimaryButton title="Preview on My Avatar" onPress={() => navigation.navigate("TryOn", { outfit })} />
            <SecondaryButton
              title={savedIndex === index ? "Saved ✓" : "Save this outfit"}
              onPress={() => handleSave(outfit, index)}
            />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
