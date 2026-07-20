import React, { useCallback, useState } from "react";
import { CompositeScreenProps, useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, Text, View } from "react-native";
import { RootStackParamList, MainTabParamList } from "../navigation/types";
import { listClosetItems } from "../api/endpoints";
import { resolveImageUrl } from "../api/client";
import { ClosetItem } from "../types";
import { PrimaryButton, Screen } from "../components/ui";
import { theme } from "../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Closet">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ClosetScreen({ navigation }: Props) {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await listClosetItems();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen>
      <View style={{ padding: theme.spacing(6), paddingBottom: theme.spacing(2) }}>
        <Text style={{ ...theme.font.display, color: theme.color.text }}>Your Closet</Text>
        <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(1) }}>
          {items.length} item{items.length === 1 ? "" : "s"} cataloged
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: theme.spacing(10) }} color={theme.color.accent} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: theme.spacing(4), paddingBottom: theme.spacing(24) }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.color.accent} />}
          ListEmptyComponent={
            <View style={{ padding: theme.spacing(8), alignItems: "center" }}>
              <Text style={{ color: theme.color.textMuted, textAlign: "center" }}>
                Nothing here yet. Take a photo of your first item to get started.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("ItemDetail", { item })}
              style={{
                flex: 1,
                margin: theme.spacing(2),
                backgroundColor: theme.color.surface,
                borderRadius: theme.radius.md,
                overflow: "hidden",
              }}
            >
              <Image source={{ uri: resolveImageUrl(item.imageUrl) }} style={{ width: "100%", aspectRatio: 1 }} />
              <View style={{ padding: theme.spacing(2.5) }}>
                <Text numberOfLines={1} style={{ color: theme.color.text, fontWeight: "600", fontSize: 13 }}>
                  {item.label}
                </Text>
                <Text style={{ color: theme.color.textMuted, fontSize: 11, marginTop: 2, textTransform: "capitalize" }}>
                  {item.garmentType}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <View style={{ position: "absolute", left: theme.spacing(6), right: theme.spacing(6), bottom: theme.spacing(6) }}>
        <PrimaryButton title="+ Add Item" onPress={() => navigation.navigate("AddItem")} />
      </View>
    </Screen>
  );
}
