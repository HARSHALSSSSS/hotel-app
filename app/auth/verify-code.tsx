import React, { useState, useRef, useEffect } from "react";
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
import { verifyResetOtp } from "@/lib/auth";
import { getApiUrl } from "@/lib/query-client";

export default function VerifyCodeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || "";
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const otp = digits.join("");

  useEffect(() => {
    if (!email) router.replace("/auth/forgot-password");
  }, [email]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const arr = value.replace(/\D/g, "").slice(0, 4).split("");
      const next = [...digits];
      arr.forEach((c, i) => {
        if (index + i < 4) next[index + i] = c;
      });
      setDigits(next);
      const nextFocus = Math.min(index + arr.length, 3);
      inputRefs.current[nextFocus]?.focus();
      return;
    }
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 4) {
      Alert.alert("Invalid code", "Please enter the 4-digit code.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { resetToken } = await verifyResetOtp(email, otp);
      router.replace({ pathname: "/auth/new-password", params: { resetToken } });
    } catch (e: any) {
      Alert.alert("Verification failed", e?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch(new URL("/api/auth/forgot-password", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResendCooldown(60);
      const id = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) clearInterval(id);
          return c - 1;
        });
      }, 1000);
      Alert.alert("Sent", "A new code has been sent to your email.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to resend.");
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

        <Text style={styles.title}>Verify Code</Text>
        <Text style={styles.subtitle}>Please enter the code we just sent to email</Text>
        {email ? (
          <Text style={styles.emailText}>{email}</Text>
        ) : (
          <Text style={styles.emailText}>your email</Text>
        )}

        <View style={styles.otpRow}>
          {[0, 1, 2, 3].map((i) => (
            <TextInput
              key={i}
              ref={(r) => (inputRefs.current[i] = r)}
              style={[styles.otpBox, digits[i] ? styles.otpBoxFilled : null]}
              value={digits[i]}
              onChangeText={(v) => handleChange(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              placeholder="-"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
              maxLength={4}
              editable={!loading}
            />
          ))}
        </View>

        <Text style={styles.didntReceive}>Didn't receive OTP?</Text>
        <Pressable style={styles.resendBtn} onPress={handleResend} disabled={loading || resendCooldown > 0}>
          <Text style={[styles.resendLink, (loading || resendCooldown > 0) && styles.resendDisabled]}>
            Resend code {resendCooldown > 0 ? `(${resendCooldown}s)` : ""}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.primaryBtn, (loading || otp.length !== 4) && styles.primaryBtnDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.length !== 4}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Verify</Text>
          )}
        </Pressable>
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
  title: { fontSize: rf(26), fontWeight: "800" as const, color: Colors.text, marginBottom: rs(8), textAlign: "center" },
  subtitle: { fontSize: rf(14), color: Colors.textSecondary, marginBottom: rs(4), textAlign: "center" },
  emailText: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
    textAlign: "center",
    marginBottom: rs(28),
    textDecorationLine: "underline",
  },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: rs(12), marginBottom: rs(24) },
  otpBox: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(12),
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: rf(22),
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
  },
  otpBoxFilled: { borderColor: Colors.primary },
  didntReceive: { fontSize: rf(14), color: Colors.textSecondary, textAlign: "center", marginBottom: rs(4) },
  resendBtn: {
    alignSelf: "center",
    minHeight: MIN_TOUCH,
    justifyContent: "center",
    marginBottom: rs(28),
  },
  resendLink: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  resendDisabled: { opacity: 0.5 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    alignItems: "center",
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontSize: rf(16), fontWeight: "700" as const, color: "#FFFFFF" },
});
