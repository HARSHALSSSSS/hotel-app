import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="guests" />
      <Stack.Screen name="info" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="add-card" />
      <Stack.Screen name="review-summary" />
      <Stack.Screen name="receipt" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
