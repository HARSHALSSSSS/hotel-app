import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider } from "@/lib/app-context";
import IncomingCallOverlay from "@/components/IncomingCallOverlay";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="hotel/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="hotel/add-review" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="hotel/location" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="hotel/directions" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="hotel/arrived" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="booking" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="profile" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="notifications" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="map" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="enter-location" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="filter" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="location-prompt" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="call" options={{ headerShown: false, animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const failsafe = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 15000);
    return () => clearTimeout(failsafe);
  }, []);
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <RootLayoutNav />
              <IncomingCallOverlay />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
