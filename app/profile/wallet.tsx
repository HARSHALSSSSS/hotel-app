import React from "react";
import { StyleSheet, View, Text, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const balance = user?.walletBalance ?? 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceIconWrap}>
            <Ionicons name="wallet" size={32} color="#fff" />
          </View>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
        </View>

        <Pressable
          style={styles.addMoneyBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/profile/add-money");
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addMoneyBtnText}>Add Money</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Recent Activity</Text>
        <View style={styles.emptyActivity}>
          <Ionicons name="receipt-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.emptyActivityText}>No recent transactions</Text>
          <Text style={styles.emptyActivitySub}>Top up or use your wallet to see activity here</Text>
        </View>
      </ScrollView>
    </View>
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
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  balanceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: "800" as const, color: "#fff" },
  addMoneyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 28,
  },
  addMoneyBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  sectionLabel: { fontSize: 14, fontWeight: "700" as const, color: Colors.text, marginBottom: 12 },
  emptyActivity: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyActivityText: { fontSize: 16, fontWeight: "600" as const, color: Colors.text, marginTop: 12 },
  emptyActivitySub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
});
