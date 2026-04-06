import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";

const GENDERS = ["Male", "Female", "Other"];

const COUNTRY_CODES = ["+1", "+44", "+91", "+81", "+86", "+33", "+49", "+61", "+971", "+55", "+34", "+39"];
const COUNTRIES = [
  "United States", "United Kingdom", "India", "Japan", "China", "France", "Germany", "Australia",
  "UAE", "Brazil", "Spain", "Italy", "Canada", "Mexico", "Thailand", "Indonesia", "Singapore", "South Korea",
];

export default function BookingInfoScreen() {
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
  }>();
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("India");
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCodePicker, setShowCodePicker] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.gender) setGender(user.gender);
      if (user.phone) {
        const parts = user.phone.trim().match(/^(\+\d+)\s*(.*)$/);
        if (parts) {
          setCountryCode(parts[1]);
          setPhone(parts[2].trim());
        } else setPhone(user.phone.trim());
      }
    }
  }, [user]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const canContinue = name.trim().length > 0 && isValidEmail(email.trim()) && phone.trim().length >= 6;

  const handleContinue = () => {
    if (!canContinue || !params.hotelId || !params.roomId) return;
    if (!isValidEmail(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fullPhone = (countryCode + " " + phone.trim()).trim();
    router.push({
      pathname: "/booking/payment",
      params: {
        ...params,
        guestName: name.trim(),
        guestEmail: email.trim(),
        guestGender: gender || "",
        guestPhone: fullPhone,
        guestCountry: country,
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={topInset}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Book Hotel</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Your Information Details</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="John Doe"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="words"
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
        />
        <Text style={styles.label}>Gender</Text>
        <Pressable style={styles.input} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowGenderPicker(true); }}>
          <Text style={gender ? styles.inputValue : styles.placeholder}>{gender || "Select"}</Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
        </Pressable>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <Pressable style={styles.countryCodeBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCodePicker(true); }}>
            <Text style={styles.countryCodeText}>{countryCode}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
          </Pressable>
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="(208) 555-0112"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="phone-pad"
          />
        </View>
        <Text style={styles.label}>Country</Text>
        <Pressable style={styles.input} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCountryPicker(true); }}>
          <Text style={styles.inputValue}>{country}</Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
        <Pressable style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]} onPress={handleContinue} disabled={!canContinue}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>
      </View>

      <Modal visible={showGenderPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowGenderPicker(false)}>
          <View style={styles.pickerBox}>
            {GENDERS.map((g) => (
              <Pressable
                key={g}
                style={styles.pickerItem}
                onPress={() => { setGender(g); setShowGenderPicker(false); }}
              >
                <Text style={styles.pickerItemText}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <Modal visible={showCountryPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCountryPicker(false)}>
          <View style={[styles.pickerBox, { maxHeight: 320 }]}>
            <ScrollView>
              {COUNTRIES.map((c) => (
                <Pressable key={c} style={styles.pickerItem} onPress={() => { setCountry(c); setShowCountryPicker(false); }}>
                  <Text style={styles.pickerItemText}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
      <Modal visible={showCodePicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCodePicker(false)}>
          <View style={styles.pickerBox}>
            {COUNTRY_CODES.map((c) => (
              <Pressable key={c} style={styles.pickerItem} onPress={() => { setCountryCode(c); setShowCodePicker(false); }}>
                <Text style={styles.pickerItemText}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
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
  sectionTitle: { fontSize: 22, fontWeight: "800" as const, color: Colors.text, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600" as const, color: Colors.text, marginBottom: 8 },
  input: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F0F0F0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 },
  inputValue: { fontSize: 16, color: Colors.text },
  placeholder: { fontSize: 16, color: Colors.textTertiary },
  phoneRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  countryCodeBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0F0F0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, minWidth: 70 },
  countryCodeText: { fontSize: 16, color: Colors.text, fontWeight: "600" as const },
  phoneInput: { flex: 1, backgroundColor: "#F0F0F0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.text },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: Colors.borderLight },
  continueBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  continueBtnDisabled: { backgroundColor: Colors.border, opacity: 0.8 },
  continueBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  pickerBox: { backgroundColor: "#fff", borderRadius: 16, minWidth: 280, maxHeight: 280 },
  pickerItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerItemText: { fontSize: 16, color: Colors.text },
});
