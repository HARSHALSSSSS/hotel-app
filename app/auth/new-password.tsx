import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { resetPassword } from "@/lib/auth";

export default function NewPasswordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ resetToken: string }>();
  const resetToken = params.resetToken || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!password || password.length < 6) {
      Alert.alert("Invalid password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    if (!resetToken) {
      Alert.alert("Error", "Invalid reset link. Please request a new one.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await resetPassword(resetToken, password);
      Alert.alert("Success", "Your password has been updated. You can sign in now.", [
        { text: "OK", onPress: () => router.replace("/auth/login") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update password.");
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
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + rs(24), paddingBottom: insets.bottom + rs(24) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={rs(24)} color={Colors.text} />
        </Pressable>

        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>
          Your new password must be different from previously used passwords.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPassword((p) => !p);
              }}
            >
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={rs(22)} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textTertiary}
              secureTextEntry={!showConfirm}
              editable={!loading}
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowConfirm((p) => !p);
              }}
            >
              <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={rs(22)} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Create New Password</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flexGrow: 1, paddingHorizontal: rs(24) },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(24),
  },
  title: { fontSize: rf(26), fontWeight: "800" as const, color: Colors.text, marginBottom: rs(8) },
  subtitle: { fontSize: rf(14), color: Colors.textSecondary, marginBottom: rs(28), lineHeight: rf(20) },
  form: { gap: rs(16) },
  label: { fontSize: rf(14), fontWeight: "600" as const, color: Colors.text },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    fontSize: rf(16),
    color: Colors.text,
  },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: rs(48) },
  eyeBtn: {
    position: "absolute",
    right: rs(12),
    top: 0,
    bottom: 0,
    justifyContent: "center",
    minWidth: MIN_TOUCH,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    alignItems: "center",
    marginTop: rs(20),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontSize: rf(16), fontWeight: "700" as const, color: "#FFFFFF" },
});
