import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { theme } from "../theme";

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ marginBottom: theme.spacing(4) }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={theme.color.textMuted} style={[styles.input, style]} {...rest} />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? <ActivityIndicator color={theme.color.bg} /> : <Text style={styles.buttonText}>{title}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}>
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  label: { ...theme.font.label, color: theme.color.textMuted, marginBottom: theme.spacing(1.5), textTransform: "uppercase" },
  input: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
    color: theme.color.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing(3.5),
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: theme.color.bg, fontWeight: "700", fontSize: 16 },
  secondaryButton: { alignItems: "center", paddingVertical: theme.spacing(3) },
  secondaryButtonText: { color: theme.color.accentAlt, fontWeight: "600", fontSize: 14 },
  chip: {
    backgroundColor: theme.color.surfaceAlt,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1.5),
    marginRight: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
  },
  chipText: { color: theme.color.text, fontSize: 12, fontWeight: "600" },
  error: { color: theme.color.danger, marginBottom: theme.spacing(3), fontSize: 13 },
});
