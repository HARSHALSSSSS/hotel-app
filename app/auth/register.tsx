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
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";

const SOCIAL_BLUE = "#1877F2";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useApp();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleRegister = async () => {
    if (!email.trim() || !name.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (!agreeTerms) {
      Alert.alert("Terms required", "Please agree with Terms & Condition.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Invalid password", "Password must be at least 6 characters.");
      return;
    }
    const username = email.split("@")[0].replace(/[^a-z0-9]/gi, "") || "user" + Date.now();
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await register(email.trim(), username, password, name.trim());
      router.replace("/auth/complete-profile");
    } catch (e: any) {
      Alert.alert("Registration failed", e?.message || "Please try again.");
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
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Fill your information below or register with your social account.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@gmail.com"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
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
            style={styles.termsRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAgreeTerms((t) => !t);
            }}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
              {agreeTerms && <Ionicons name="checkmark" size={rs(16)} color="#fff" />}
            </View>
            <Text style={styles.termsText}>Agree with </Text>
            <Pressable onPress={() => Linking.openURL("https://example.com/terms")}>
              <Text style={styles.termsLink}>Terms & Condition</Text>
            </Pressable>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign Up</Text>
            )}
          </Pressable>

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or sign up with</Text>
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
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace("/auth/login");
            }}
            disabled={loading}
          >
            <Text style={styles.footerLink}>Sign In</Text>
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
    marginBottom: rs(28),
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
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: rs(4),
  },
  checkbox: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(6),
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: rs(10),
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    fontSize: rf(14),
    color: Colors.text,
  },
  termsLink: {
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
    marginTop: rs(20),
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
    gap: rs(4),
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
