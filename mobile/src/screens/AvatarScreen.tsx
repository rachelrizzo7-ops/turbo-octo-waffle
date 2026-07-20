import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { RootStackParamList, MainTabParamList } from "../navigation/types";
import { getAvatar } from "../api/endpoints";
import { resolveImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../types";
import { PrimaryButton, Screen, SecondaryButton } from "../components/ui";
import { theme } from "../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Avatar">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function AvatarScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getAvatar()
        .then(setAvatar)
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <Screen>
      <View style={{ padding: theme.spacing(6) }}>
        <Text style={{ ...theme.font.display, color: theme.color.text }}>Avatar</Text>
        <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(1) }}>{user?.email}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.color.accent} />
      ) : (
        <View style={{ paddingHorizontal: theme.spacing(6), flex: 1 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.lg,
              overflow: "hidden",
              marginBottom: theme.spacing(4),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatar ? (
              <Image source={{ uri: resolveImageUrl(avatar.imageUrl) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <Text style={{ color: theme.color.textMuted, padding: theme.spacing(6), textAlign: "center" }}>
                No avatar yet. Take a full-body photo so you can preview outfits on yourself.
              </Text>
            )}
          </View>

          <PrimaryButton
            title={avatar ? "Retake Photo" : "Set Up Avatar"}
            onPress={() => navigation.navigate("AvatarSetup")}
          />
          <SecondaryButton title="Log Out" onPress={signOut} />
        </View>
      )}
    </Screen>
  );
}
