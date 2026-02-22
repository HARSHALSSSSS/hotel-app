import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Wallet</Text>
        <View style={styles.methodCard}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}>
              <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.methodTitle}>Wallet</Text>
              <Text style={styles.methodSub}>Balance: ₹{(user?.walletBalance ?? 0).toLocaleString("en-IN")}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Credit & Debit Card</Text>
        <Pressable
          style={styles.methodCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: "/booking/add-card",
              params: { returnTo: "profile" },
            });
          }}
        >
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}>
              <Ionicons name="card-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.methodTitle}>Add Card</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={Colors.textTertiary} />
        </Pressable>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>More options</Text>
        <View style={styles.methodCard}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}><Text style={styles.phonepayText}>Phone Pay</Text></View>
            <Text style={styles.methodTitle}>Phone Pay (UPI)</Text>
          </View>
          <Text style={styles.availableLabel}>Available at checkout</Text>
        </View>
        <View style={styles.methodCard}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}><Ionicons name="logo-apple" size={24} color={Colors.text} /></View>
            <Text style={styles.methodTitle}>Apple Pay</Text>
          </View>
          <Text style={styles.comingSoon}>Coming soon</Text>
        </View>
        <View style={styles.methodCard}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}><Ionicons name="logo-google" size={24} color="#4285F4" /></View>
            <Text style={styles.methodTitle}>Google Pay (UPI)</Text>
          </View>
          <Text style={styles.availableLabel}>Available at checkout</Text>
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
  sectionLabel: { fontSize: 14, fontWeight: "700" as const, color: Colors.text, marginBottom: 12 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
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
  phonepayText: { fontSize: 12, fontWeight: "700" as const, color: "#5F259F" },
  comingSoon: { fontSize: 13, color: Colors.textTertiary },
  availableLabel: { fontSize: 13, color: Colors.success, fontWeight: "600" as const },
});
