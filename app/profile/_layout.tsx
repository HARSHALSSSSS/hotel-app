import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="edit" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="cancel-booking" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="add-money" />
      <Stack.Screen name="top-up" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help-center" />
      <Stack.Screen name="password-manager" />
      <Stack.Screen name="notification-settings" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy-policy" />
    </Stack>
  );
}
