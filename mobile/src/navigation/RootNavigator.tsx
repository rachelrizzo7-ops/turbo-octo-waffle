import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { RootStackParamList } from "./types";
import MainTabs from "./MainTabs";
import AuthScreen from "../screens/AuthScreen";
import AddItemScreen from "../screens/AddItemScreen";
import ItemDetailScreen from "../screens/ItemDetailScreen";
import AvatarSetupScreen from "../screens/AvatarSetupScreen";
import OutfitRecommendScreen from "../screens/OutfitRecommendScreen";
import TryOnScreen from "../screens/TryOnScreen";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.color.bg,
    card: theme.color.surface,
    text: theme.color.text,
    border: theme.color.border,
    primary: theme.color.accent,
  },
};

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.color.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <AuthScreen />
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.color.bg },
            headerTintColor: theme.color.text,
            headerTitleStyle: { color: theme.color.text },
          }}
        >
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddItem" component={AddItemScreen} options={{ title: "Add Item" }} />
          <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: "" }} />
          <Stack.Screen name="AvatarSetup" component={AvatarSetupScreen} options={{ title: "Avatar" }} />
          <Stack.Screen name="OutfitRecommend" component={OutfitRecommendScreen} options={{ title: "Outfit Ideas" }} />
          <Stack.Screen name="TryOn" component={TryOnScreen} options={{ title: "Try On" }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
