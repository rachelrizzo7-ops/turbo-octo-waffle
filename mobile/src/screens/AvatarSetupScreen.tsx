import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { RootStackParamList } from "../navigation/types";
import { uploadAvatar } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { ErrorText, PrimaryButton, Screen, SecondaryButton } from "../components/ui";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "AvatarSetup">;

export default function AvatarSetupScreen({ navigation }: Props) {
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Camera permission is required to set up your avatar.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
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
      await uploadAvatar({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
      navigation.goBack();
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't process that photo. Try again."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <View style={{ padding: theme.spacing(6), flex: 1 }}>
        <Text style={{ ...theme.font.title, color: theme.color.text, marginBottom: theme.spacing(1) }}>
          Set up your avatar
        </Text>
        <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(6) }}>
          A full-body photo, facing the camera, standing straight, works best — this is what
          outfits get previewed on.
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
              Setting up avatar…
            </Text>
          </View>
        ) : (
          <>
            <PrimaryButton title="Take Full-Body Photo" onPress={takePhoto} />
            {asset && <SecondaryButton title="Save Avatar" onPress={submit} />}
          </>
        )}
      </View>
    </Screen>
  );
}
