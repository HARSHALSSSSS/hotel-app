import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

function Stepper({ value, onMinus, onPlus, min = 0 }: { value: number; onMinus: () => void; onPlus: () => void; min?: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable
        style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
        onPress={() => { if (value > min) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onMinus(); } }}
        disabled={value <= min}
      >
        <Text style={[styles.stepperBtnText, value <= min && styles.stepperBtnTextDisabled]}>−</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable style={styles.stepperBtnPlus} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPlus(); }}>
        <Text style={styles.stepperBtnTextPlus}>+</Text>
      </Pressable>
    </View>
  );
}

export default function BookingGuestsScreen() {
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
  }>();
  const insets = useSafeAreaInsets();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const totalGuests = adults + children + infants;

  const handleContinue = () => {
    if (!params.hotelId || !params.roomId || !params.checkIn || !params.checkOut) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/booking/info",
      params: {
        ...params,
        adults: adults.toString(),
        children: children.toString(),
        infants: infants.toString(),
      },
    });
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
        <Text style={styles.headerTitle}>Select Guest</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + bottomInset }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.guestRow}>
            <View>
              <Text style={styles.guestLabel}>Adults</Text>
              <Text style={styles.guestSub}>Ages 18 or Above</Text>
            </View>
            <Stepper value={adults} onMinus={() => setAdults((n) => Math.max(1, n - 1))} onPlus={() => setAdults((n) => n + 1)} min={1} />
          </View>
          <View style={styles.guestRow}>
            <View>
              <Text style={styles.guestLabel}>Children</Text>
              <Text style={styles.guestSub}>Ages 2-17</Text>
            </View>
            <Stepper value={children} onMinus={() => setChildren((n) => Math.max(0, n - 1))} onPlus={() => setChildren((n) => n + 1)} />
          </View>
          <View style={styles.guestRow}>
            <View>
              <Text style={styles.guestLabel}>Infants</Text>
              <Text style={styles.guestSub}>Under Ages 2</Text>
            </View>
            <Stepper value={infants} onMinus={() => setInfants((n) => Math.max(0, n - 1))} onPlus={() => setInfants((n) => n + 1)} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
        <Pressable style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Continue</Text>
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
  backBtn: { width: Math.max(40, 44), height: Math.max(40, 44), borderRadius: 22, backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, gap: 24 },
  guestRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  guestLabel: { fontSize: 16, fontWeight: "700" as const, color: Colors.text },
  guestSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#E8E8E8", alignItems: "center", justifyContent: "center" },
  stepperBtnDisabled: { opacity: 0.5 },
  stepperBtnText: { fontSize: 20, fontWeight: "600" as const, color: Colors.text },
  stepperBtnTextDisabled: { color: Colors.textTertiary },
  stepperValue: { fontSize: 18, fontWeight: "700" as const, color: Colors.text, minWidth: 28, textAlign: "center" as const },
  stepperBtnPlus: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  stepperBtnTextPlus: { fontSize: 20, fontWeight: "600" as const, color: "#fff" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: Colors.borderLight },
  continueBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  continueBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
});
