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

const SOCIAL_BLUE = "#1877F2";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const u = await login(email.trim(), password);
      if (u && (!u.phone || u.phone.trim() === "")) {
        router.replace("/auth/complete-profile");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      Alert.alert("Login failed", e?.message || "Please try again.");
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
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Hi! Welcome back, you've been missed</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@gmail.com"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
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

          <Pressable
            style={styles.forgotLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/auth/forgot-password");
            }}
            disabled={loading}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </Pressable>

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or sign in with</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.socialRow}>
            <Pressable style={styles.socialBtn} onPress={() => {}}>
              <Ionicons name="logo-apple" size={rs(24)} color="#000" />
            </Pressable>
            <Pressable style={styles.socialBtn} onPress={() => {}}>
              <Ionicons name="logo-google" size={rs(24)} color="#000" />
            </Pressable>
            <Pressable style={styles.socialBtn} onPress={() => {}}>
              <Ionicons name="logo-facebook" size={rs(24)} color={SOCIAL_BLUE} />
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/auth/register");
            }}
            disabled={loading}
          >
            <Text style={styles.footerLink}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
  },
  title: {
    fontSize: rf(32),
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: rs(8),
    textAlign: "center",
  },
  subtitle: {
    fontSize: rf(15),
    color: Colors.textSecondary,
    marginBottom: rs(32),
    textAlign: "center",
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
    backgroundColor: "#F5F5F5",
    borderWidth: 0,
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    fontSize: rf(16),
    color: Colors.text,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: rs(48),
  },
  eyeBtn: {
    position: "absolute",
    right: rs(12),
    top: 0,
    bottom: 0,
    justifyContent: "center",
    minWidth: MIN_TOUCH,
  },
  forgotLink: {
    alignSelf: "flex-end",
  },
  forgotText: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
    textDecorationLine: "underline",
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
    color: "#FFFFFF",
  },
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: rs(28),
    marginBottom: rs(20),
    gap: rs(12),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: rf(13),
    color: Colors.textSecondary,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: rs(20),
  },
  socialBtn: {
    width: Math.max(rs(56), MIN_TOUCH),
    height: Math.max(rs(56), MIN_TOUCH),
    borderRadius: rs(28),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
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
  footerLink: {
    fontSize: rf(14),
    fontWeight: "700" as const,
    color: Colors.primary,
    textDecorationLine: "underline",
  },
});
