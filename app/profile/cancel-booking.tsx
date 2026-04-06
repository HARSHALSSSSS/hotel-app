import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";

const CANCELLATION_REASONS = [
  "Change in Plans",
  "Unforeseen Events",
  "Unexpected Work",
  "Personal Preferences",
  "Booking Mistakes",
  "Other",
] as const;

export default function CancelBookingScreen() {
  const params = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();
  const { cancelBooking, refreshBookings } = useApp();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const bookingId = params.bookingId;

  const canSubmit = selectedReason && (selectedReason !== "Other" || otherReason.trim().length > 0);

  const handleSubmit = async () => {
    if (!bookingId || !canSubmit) return;
    const reason = selectedReason === "Other" ? otherReason.trim() : selectedReason!;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await cancelBooking(bookingId, reason);
      Alert.alert("Booking Cancelled", "Your reservation has been cancelled. A refund will be processed if applicable.", [
        { text: "OK", onPress: () => router.replace({ pathname: "/profile/bookings", params: { tab: "cancelled" } }) },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to cancel booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={topInset}
    >
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Cancel Booking</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.prompt}>Please select the reason for cancellations:</Text>

        {CANCELLATION_REASONS.map((reason) => (
          <Pressable
            key={reason}
            style={styles.radioRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedReason(reason);
            }}
          >
            <View style={[styles.radioOuter, selectedReason === reason && styles.radioOuterSelected]}>
              {selectedReason === reason && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{reason}</Text>
          </Pressable>
        ))}

        <Text style={[styles.label, { marginTop: 20 }]}>Other</Text>
        <TextInput
          style={styles.otherInput}
          value={otherReason}
          onChangeText={setOtherReason}
          placeholder="Enter your Reason"
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
          editable={selectedReason === "Other"}
        />

        <Pressable
          style={[styles.submitBtn, (!canSubmit || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Cancel Booking</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center" as const,
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  prompt: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioOuterSelected: { borderColor: Colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioLabel: { fontSize: 15, color: Colors.text, flex: 1 },
  label: { fontSize: 14, fontWeight: "600" as const, color: Colors.text, marginBottom: 8 },
  otherInput: {
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitBtn: {
    marginTop: 32,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  submitBtnDisabled: { backgroundColor: Colors.border, opacity: 0.8 },
  submitBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
});
