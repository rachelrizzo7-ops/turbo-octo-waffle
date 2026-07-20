import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";
import { ErrorText, Field, PrimaryButton, Screen, SecondaryButton } from "../components/ui";
import { theme } from "../theme";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: theme.spacing(6) }}>
          <Text style={{ ...theme.font.display, color: theme.color.text, marginBottom: theme.spacing(1) }}>
            Closet AI
          </Text>
          <Text style={{ color: theme.color.textMuted, marginBottom: theme.spacing(8) }}>
            Photograph your closet, get AI-tagged inventory, and outfit ideas styled on your own avatar.
          </Text>

          <Field
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <ErrorText>{error}</ErrorText>

          <View style={{ marginTop: theme.spacing(2) }}>
            <PrimaryButton
              title={mode === "login" ? "Log In" : "Create Account"}
              onPress={submit}
              loading={loading}
              disabled={!email || password.length < 8}
            />
            <SecondaryButton
              title={mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
              onPress={() => setMode(mode === "login" ? "signup" : "login")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
