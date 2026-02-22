import React from "react";
import { StyleSheet, View, Text, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: February 2025</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By using Hotel Booking Hub (the "App"), you agree to these Terms of Service. If you do not agree, please do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>2. Use of the Service</Text>
        <Text style={styles.paragraph}>
          You may use the App to search and book hotel stays, manage your profile, wallet, and bookings. You must provide accurate information and be at least 18 years old to make bookings. You are responsible for keeping your account secure.
        </Text>

        <Text style={styles.sectionTitle}>3. Bookings and Payments</Text>
        <Text style={styles.paragraph}>
          Bookings are subject to availability and hotel policies. Payment is due as indicated at checkout. Cancellation and refund rules apply as stated at the time of booking and in the hotel's policy.
        </Text>

        <Text style={styles.sectionTitle}>4. Cancellations</Text>
        <Text style={styles.paragraph}>
          You may cancel eligible bookings through the App. Refunds are processed according to the cancellation policy. We are not responsible for hotel no-show or early-departure fees imposed by the property.
        </Text>

        <Text style={styles.sectionTitle}>5. Prohibited Conduct</Text>
        <Text style={styles.paragraph}>
          You may not use the App for illegal purposes, to harm others, or to abuse the platform. We may suspend or terminate your account for violation of these terms.
        </Text>

        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The App and its content (excluding user content) are owned by us or our licensors. You may not copy, modify, or distribute our materials without permission.
        </Text>

        <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          We are not liable for indirect, incidental, or consequential damages arising from your use of the App or bookings. Our liability is limited to the amount you paid for the service in question.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact</Text>
        <Text style={styles.paragraph}>
          For questions about these terms, contact us via the Help Center or at support@hotelbookinghub.com.
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
