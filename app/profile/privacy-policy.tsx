import React from "react";
import { StyleSheet, View, Text, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: February 2025</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide when you create an account (name, email, phone), make bookings (dates, guests, payment details), and use our app (preferences, device info). We also collect usage data to improve our services.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to process bookings, send confirmations and reminders, improve our app and customer support, send relevant offers (with your consent), and comply with legal obligations.
        </Text>

        <Text style={styles.sectionTitle}>3. Data Sharing</Text>
        <Text style={styles.paragraph}>
          We may share your data with hotels and partners to fulfil your bookings, with payment processors for transactions, and with authorities when required by law. We do not sell your personal data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We use industry-standard measures to protect your data, including encryption and secure servers. Passwords are hashed and never stored in plain text.
        </Text>

        <Text style={styles.sectionTitle}>5. Your Rights</Text>
        <Text style={styles.paragraph}>
          You can access, update, or delete your account and data from the app. You may opt out of marketing communications and request a copy of your data. Contact us for any privacy requests.
        </Text>

        <Text style={styles.sectionTitle}>6. Cookies & Similar Technologies</Text>
        <Text style={styles.paragraph}>
          We use cookies and similar technologies for authentication, preferences, and analytics. You can manage these in your device or browser settings.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact</Text>
        <Text style={styles.paragraph}>
          For privacy-related questions or requests, contact us at privacy@hotelbookinghub.com or via the Help Center in the app.
        </Text>
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
  updated: { fontSize: 13, color: Colors.textTertiary, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700" as const, color: Colors.text, marginBottom: 8, marginTop: 16 },
  paragraph: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },
});
