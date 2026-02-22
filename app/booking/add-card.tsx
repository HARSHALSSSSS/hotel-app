import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

export default function AddCardScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const insets = useSafeAreaInsets();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const isFromBooking = !!(params.hotelId && params.checkIn);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (params.returnTo === "profile") {
      router.replace("/profile/payment-methods");
      return;
    }
    router.push({
      pathname: "/booking/review-summary",
      params: {
        ...params,
        paymentMethod: "card",
        cardLast4: undefined,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Pay with Card</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="card-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.infoTitle}>Secure Razorpay Checkout</Text>
          <Text style={styles.infoText}>
            Your card details will be entered securely in the Razorpay payment window. We never store your card number.
          </Text>
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.securityText}>PCI DSS compliant • Encrypted</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
        <Pressable style={styles.addCardBtn} onPress={handleContinue}>
          <Text style={styles.addCardBtnText}>{isFromBooking ? "Continue to Review" : "Continue"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary + "15", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  infoTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text, marginBottom: 8 },
  infoText: { fontSize: 15, color: Colors.textSecondary, textAlign: "center" as const, lineHeight: 22, marginBottom: 16 },
  securityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  securityText: { fontSize: 14, color: Colors.success, fontWeight: "600" as const },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: Colors.borderLight },
  addCardBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  addCardBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
});
