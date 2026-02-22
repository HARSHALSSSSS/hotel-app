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
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";

type Step = "email" | "otp";

export default function OtpLoginScreen() {
  const insets = useSafeAreaInsets();
  const { requestOtp, loginWithOtp } = useApp();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Please enter your email.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await requestOtp(email.trim());
      setStep("otp");
      setOtp("");
      if (result.otp && __DEV__) {
        Alert.alert("Dev OTP", `Your OTP: ${result.otp}`);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send OTP. Make sure this email is registered.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await loginWithOtp(email.trim(), otp.trim());
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Verification failed", e?.message || "Invalid or expired OTP.");
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
        <Pressable style={styles.backBtn} onPress={() => (step === "otp" ? setStep("email") : router.back())}>
          <Ionicons name="chevron-back" size={rs(24)} color={Colors.text} />
        </Pressable>

        <View style={styles.iconWrap}>
          <Ionicons name="key" size={rs(40)} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{step === "email" ? "Sign in with OTP" : "Enter code"}</Text>
        <Text style={styles.subtitle}>
          {step === "email"
            ? "We'll send a one-time code to your email."
            : `We sent a 6-digit code to ${email}. Enter it below.`}
        </Text>

        <View style={styles.form}>
          {step === "email" ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              <Pressable
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.primaryBtnText}>Send OTP</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>6-digit code</Text>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              <Pressable
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & sign in</Text>
                )}
              </Pressable>
              <Pressable style={styles.resendBtn} onPress={handleRequestOtp} disabled={loading}>
                <Text style={styles.resendText}>Resend code</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Prefer password?</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/auth/login");
            }}
            disabled={loading}
            style={styles.footerLinkBtn}
          >
            <Text style={styles.footerLink}>Sign in with password</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
  },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(24),
  },
  iconWrap: {
    width: rs(72),
    height: rs(72),
    borderRadius: rs(36),
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(20),
  },
  title: {
    fontSize: rf(26),
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: rs(8),
  },
  subtitle: {
    fontSize: rf(15),
    color: Colors.textSecondary,
    marginBottom: rs(28),
    lineHeight: rf(22),
  },
  form: {
    gap: rs(16),
  },
  label: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    fontSize: rf(16),
    color: Colors.text,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    alignItems: "center",
    marginTop: rs(8),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
  resendBtn: {
    alignItems: "center",
    paddingVertical: rs(12),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  resendText: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: rs(6),
    marginTop: rs(32),
  },
  footerText: {
    fontSize: rf(14),
    color: Colors.textSecondary,
  },
  footerLinkBtn: {
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  footerLink: {
    fontSize: rf(14),
    fontWeight: "700" as const,
    color: Colors.primary,
  },
});
