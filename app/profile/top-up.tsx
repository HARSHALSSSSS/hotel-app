import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";

export default function TopUpScreen() {
  const params = useLocalSearchParams<{ amount: string }>();
  const insets = useSafeAreaInsets();
  const { topUpWallet, refreshUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const amount = parseFloat(params.amount || "0") || 0;

  const handleTopUp = async () => {
    if (amount <= 0) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await topUpWallet(amount);
      await refreshUser();
      setSuccess(true);
    } catch (e: any) {
      Alert.alert("Top-up failed", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>Top-up Successful</Text>
        <Text style={styles.successSub}>₹{amount.toLocaleString("en-IN")} has been added to your wallet.</Text>
        <Pressable style={styles.doneBtn} onPress={() => router.replace("/profile/wallet")}>
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Top Up E-Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to add</Text>
          <Text style={styles.amountValue}>₹{amount.toLocaleString("en-IN")}</Text>
        </View>

        <Text style={styles.sectionLabel}>Payment method</Text>
        <View style={styles.methodCard}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}>
              <Ionicons name="card-outline" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.methodTitle}>Card / UPI</Text>
              <Text style={styles.methodSub}>Pay securely to add to wallet</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={Colors.textTertiary} />
        </View>

        <Pressable
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleTopUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>Top Up E-Wallet</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: "center", alignItems: "center", padding: 24 },
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
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  amountCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  amountLabel: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginBottom: 4 },
  amountValue: { fontSize: 28, fontWeight: "800" as const, color: "#fff" },
  sectionLabel: { fontSize: 14, fontWeight: "700" as const, color: Colors.text, marginBottom: 12 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  methodLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  methodTitle: { fontSize: 16, fontWeight: "600" as const, color: Colors.text },
  methodSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  confirmBtnDisabled: { opacity: 0.8 },
  confirmBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  successIconWrap: { marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: "800" as const, color: Colors.text, marginBottom: 8 },
  successSub: { fontSize: 16, color: Colors.textSecondary, marginBottom: 32 },
  doneBtn: { backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 14 },
  doneBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
});
