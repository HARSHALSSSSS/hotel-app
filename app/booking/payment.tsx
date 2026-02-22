import React, { useState, useMemo } from "react";
import { StyleSheet, View, Text, Pressable, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type PaymentOption = "cash" | "wallet" | "card" | "phonepay" | "apple" | "google";

export default function BookingPaymentScreen() {
  const params = useLocalSearchParams<{
    hotelId: string;
    roomId: string;
    roomName: string;
    roomPrice: string;
    hotelName: string;
    hotelImage: string;
    checkIn: string;
    checkOut: string;
    note: string;
    adults: string;
    children: string;
    infants: string;
    guestName: string;
    guestEmail: string;
    guestGender: string;
    guestPhone: string;
    guestCountry: string;
  }>();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PaymentOption>("cash");
  const [error, setError] = useState<string | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleConfirm = () => {
    if (!params.hotelId || !params.roomId || !params.checkIn || !params.checkOut) return;
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selected === "card") {
      router.push({ pathname: "/booking/add-card", params: { ...params } });
      return;
    }
    const paymentMethod = selected === "wallet" ? "wallet" : selected === "phonepay" ? "phonepay" : selected === "apple" ? "apple" : selected === "google" ? "google" : "on_arrival";
    router.push({
      pathname: "/booking/review-summary",
      params: { ...params, paymentMethod },
    });
  };

  const handleAddCardRow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected("card");
    router.push({ pathname: "/booking/add-card", params: { ...params } });
  };

  if (!params.hotelId || !params.checkIn || !params.checkOut) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topInset + 60 }]}>
        <Text style={styles.errorText}>Missing booking details</Text>
        <Pressable style={styles.backBtnStandalone} onPress={() => router.back()}>
          <Text style={styles.backBtnStandaloneText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomInset }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Cash</Text>
        <Pressable style={styles.methodRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected("cash"); }}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}>
              <Ionicons name="cash-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.methodLabel}>Cash</Text>
          </View>
          <View style={[styles.radio, selected === "cash" && styles.radioSelected]}>
            {selected === "cash" && <View style={styles.radioInner} />}
          </View>
        </Pressable>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Wallet</Text>
        <Pressable style={styles.methodRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected("wallet"); }}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}>
              <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.methodLabel}>Wallet</Text>
          </View>
          <View style={[styles.radio, selected === "wallet" && styles.radioSelected]}>
            {selected === "wallet" && <View style={styles.radioInner} />}
          </View>
        </Pressable>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Credit & Debit Card</Text>
        <Pressable style={styles.methodRow} onPress={handleAddCardRow}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}>
              <Ionicons name="card-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.methodLabel}>Pay with Card (Razorpay)</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={Colors.textTertiary} />
        </Pressable>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>More Payment Options</Text>
        <Pressable style={styles.methodRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected("phonepay"); }}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}><Text style={styles.phonepayText}>Phone Pay</Text></View>
            <Text style={styles.methodLabel}>Phone Pay</Text>
          </View>
          <View style={[styles.radio, selected === "phonepay" && styles.radioSelected]}>
            {selected === "phonepay" && <View style={styles.radioInner} />}
          </View>
        </Pressable>
        <Pressable style={styles.methodRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected("apple"); }}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}><Ionicons name="logo-apple" size={24} color={Colors.text} /></View>
            <Text style={styles.methodLabel}>Apple Pay</Text>
          </View>
          <View style={[styles.radio, selected === "apple" && styles.radioSelected]}>
            {selected === "apple" && <View style={styles.radioInner} />}
          </View>
        </Pressable>
        <Pressable style={styles.methodRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected("google"); }}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIconWrap}><Ionicons name="logo-google" size={24} color="#4285F4" /></View>
            <Text style={styles.methodLabel}>Google Pay</Text>
          </View>
          <View style={[styles.radio, selected === "google" && styles.radioSelected]}>
            {selected === "google" && <View style={styles.radioInner} />}
          </View>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
        {error ? <Text style={styles.footerError}>{error}</Text> : null}
        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Confirm Payment</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { fontSize: 16, color: Colors.textSecondary, marginBottom: 16 },
  backBtnStandalone: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  backBtnStandaloneText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  sectionLabel: { fontSize: 14, fontWeight: "700" as const, color: Colors.text, marginBottom: 12 },
  methodRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12 },
  methodLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  methodIconWrap: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary + "18", alignItems: "center", justifyContent: "center" },
  methodLabel: { fontSize: 16, fontWeight: "600" as const, color: Colors.text },
  phonepayText: { fontSize: 12, fontWeight: "700" as const, color: "#5F259F" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: Colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: Colors.borderLight },
  footerError: { fontSize: 13, color: Colors.error, marginBottom: 8 },
  confirmBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  confirmBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
});
