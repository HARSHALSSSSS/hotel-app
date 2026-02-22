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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const { deleteAccount } = useApp();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleDelete = () => {
    if (!password.trim()) {
      Alert.alert("Password required", "Enter your password to confirm account deletion.");
      return;
    }
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await deleteAccount(password);
              router.replace("/(tabs)");
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete account.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={40} color={Colors.error} />
          <Text style={styles.warningTitle}>This action cannot be undone</Text>
          <Text style={styles.warningText}>
            Deleting your account will remove all your bookings, reviews, and profile data permanently.
          </Text>
        </View>

        <Text style={styles.label}>Enter your password to confirm</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor={Colors.textTertiary}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={styles.eyeBtn}
            onPress={() => setShowPassword((s) => !s)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={Colors.textTertiary}
            />
          </Pressable>
        </View>

        <Pressable
          style={[styles.deleteBtn, (!password.trim() || loading) && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={!password.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteBtnText}>Delete Account</Text>
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
  warningCard: {
    backgroundColor: Colors.error + "12",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.error,
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  label: { fontSize: 14, fontWeight: "600" as const, color: Colors.text, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: { flex: 1, fontSize: 16, color: Colors.text, paddingVertical: 14 },
  eyeBtn: { padding: 8 },
  deleteBtn: {
    marginTop: 32,
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  deleteBtnDisabled: { backgroundColor: Colors.border, opacity: 0.8 },
  deleteBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
});
