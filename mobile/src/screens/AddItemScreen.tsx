import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { uploadClosetItem } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { ErrorText, PrimaryButton, Screen, SecondaryButton } from "../components/ui";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddItem">;

export default function AddItemScreen({ navigation }: Props) {
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission is required to photograph an item.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setAsset(result.assets[0]);
    }
  };

  const pickFromLibrary = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setAsset(result.assets[0]);
    }
  };

  const submit = async () => {
    if (!asset) return;
    setUploading(true);
    setError(null);
    try {
      const item = await uploadClosetItem({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
      navigation.replace("ItemDetail", { item });
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't classify that photo. Try again."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <View style={{ padding: theme.spacing(6), flex: 1 }}>
        <Text style={{ ...theme.font.title, color: theme.color.text, marginBottom: theme.spacing(1) }}>
          Add a closet item
        </Text>
        <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
          Lay the item flat or on a hanger, in good light. Claude will tag it automatically.
        </Text>

        <View
          style={{
            flex: 1,
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.color.border,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            marginBottom: theme.spacing(6),
          }}
        >
          {asset ? (
            <Image source={{ uri: asset.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <Text style={{ color: theme.color.textMuted }}>No photo yet</Text>
          )}
        </View>

        <ErrorText>{error}</ErrorText>

        {uploading ? (
          <View style={{ alignItems: "center", paddingVertical: theme.spacing(4) }}>
            <ActivityIndicator color={theme.color.accent} />
            <Text style={{ color: theme.color.textMuted, marginTop: theme.spacing(2) }}>
              Classifying with Claude…
            </Text>
          </View>
        ) : (
          <>
            <PrimaryButton title="Take Photo" onPress={takePhoto} />
            <SecondaryButton title="Choose from Library" onPress={pickFromLibrary} />
            {asset && <PrimaryButton title="Save to Closet" onPress={submit} />}
          </>
        )}
      </View>
    </Screen>
  );
}
