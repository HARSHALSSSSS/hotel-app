import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/lib/app-context";
import Colors from "@/constants/colors";
import { rs } from "@/constants/responsive";

export default function IndexScreen() {
  const { user, isLoading, hasSeenLocationPrompt, hasCompletedOnboarding } = useApp();

  useEffect(() => {
    if (isLoading) return;
    if (!hasCompletedOnboarding) {
      router.replace("/onboarding");
      return;
    }
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (!user.phone || user.phone.trim() === "") {
      router.replace("/auth/complete-profile");
      return;
    }
    if (!hasSeenLocationPrompt) {
      router.replace("/location-prompt");
      return;
    }
    router.replace("/(tabs)");
  }, [user, isLoading, hasSeenLocationPrompt, hasCompletedOnboarding]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
});
