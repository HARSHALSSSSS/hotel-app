import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function AddMoneyScreen() {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");
  const [selectedQuick, setSelectedQuick] = useState<number | null>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0;

  const handleQuickSelect = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuick(value);
    setAmount(value.toString());
  };

  const handleAddMoney = () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/profile/top-up",
      params: { amount: numAmount.toString() },
    });
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
        <Text style={styles.headerTitle}>Add Money</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Enter Amount</Text>
        <View style={styles.amountInputWrap}>
          <Text style={styles.currencyPrefix}>₹</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(t) => {
              setAmount(t.replace(/[^0-9.]/g, ""));
              setSelectedQuick(null);
            }}
            placeholder="0.00"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={[styles.label, { marginTop: 24 }]}>Quick amount</Text>
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((value) => (
            <Pressable
              key={value}
              style={[styles.quickBtn, selectedQuick === value && styles.quickBtnSelected]}
              onPress={() => handleQuickSelect(value)}
            >
              <Text style={[styles.quickBtnText, selectedQuick === value && styles.quickBtnTextSelected]}>
                ₹{value.toLocaleString("en-IN")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.addMoneyBtn, !isValid && styles.addMoneyBtnDisabled]}
          onPress={handleAddMoney}
          disabled={!isValid}
        >
          <Text style={styles.addMoneyBtnText}>Add Money</Text>
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
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  label: { fontSize: 14, fontWeight: "600" as const, color: Colors.text, marginBottom: 10 },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 56,
  },
  currencyPrefix: { fontSize: 24, fontWeight: "700" as const, color: Colors.text, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: "700" as const, color: Colors.text, paddingVertical: 12 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  quickBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  quickBtnSelected: { backgroundColor: Colors.primary },
  quickBtnText: { fontSize: 16, fontWeight: "600" as const, color: Colors.text },
  quickBtnTextSelected: { color: "#fff" },
  addMoneyBtn: {
    marginTop: 32,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  addMoneyBtnDisabled: { backgroundColor: Colors.border, opacity: 0.8 },
  addMoneyBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
});
