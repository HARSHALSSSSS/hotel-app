import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { getOptimizedImageUrl } from "@/lib/image-utils";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";

const { width } = Dimensions.get("window");
const DATE_BUTTON_WIDTH = rs(88);
const DATE_GAP = rs(10);

function formatDayLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d0 = new Date(d);
  d0.setHours(0, 0, 0, 0);
  const diff = Math.round((d0.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Today " + d.getDate() + " " + d.toLocaleDateString("en-US", { month: "short" });
  return d.toLocaleDateString("en-US", { weekday: "short" }) + " " + d.getDate() + " " + d.toLocaleDateString("en-US", { month: "short" });
}

export default function BookingDateScreen() {
  const { isAuthenticated } = useApp();
  const params = useLocalSearchParams<{
    hotelId: string;
    roomId: string;
    roomName: string;
    roomPrice: string;
    hotelName: string;
    hotelImage: string;
    originalPrice?: string;
    hotelAddress?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [note, setNote] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const checkInDates = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [today]);

  const checkOutDates = useMemo(() => {
    if (!checkIn) return [];
    const arr: Date[] = [];
    for (let i = 1; i <= 30; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [checkIn]);

  const orig = params.originalPrice ? parseFloat(params.originalPrice) : 0;
  const curr = params.roomPrice ? parseFloat(params.roomPrice) : 0;
  const discountPercent = orig > curr && orig > 0 ? Math.round(((orig - curr) / orig) * 100) : 0;
  const fullAddress = params.hotelAddress || "Hotel address";
  const canContinue = checkIn != null && checkOut != null && checkOut > checkIn;

  const handleContinue = () => {
    if (!canContinue || !params.hotelId || !params.roomId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/booking/guests",
      params: {
        hotelId: params.hotelId,
        roomId: params.roomId,
        roomName: params.roomName || "",
        roomPrice: params.roomPrice || "",
        hotelName: params.hotelName || "",
        hotelImage: params.hotelImage || "",
        checkIn: checkIn!.toISOString(),
        checkOut: checkOut!.toISOString(),
        note: note.trim(),
      },
    });
  };

  if (!params.hotelId || !params.roomId) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topInset + 60 }]}>
        <Text style={styles.errorText}>Missing booking details</Text>
        <Pressable style={styles.backBtnStandalone} onPress={() => router.back()}>
          <Text style={styles.backBtnStandaloneText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topInset + 60 }]}>
        <Text style={[styles.errorText, { marginBottom: 16 }]}>Sign in to continue booking</Text>
        <Text style={styles.authSubText}>You need to be signed in to make a reservation</Text>
        <Pressable style={styles.backBtnStandalone} onPress={() => router.push("/auth/login")}>
          <Text style={styles.backBtnStandaloneText}>Sign In</Text>
        </Pressable>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: getOptimizedImageUrl(params.hotelImage, "full") || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80" }}
            style={styles.heroImage}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            priority="high"
          />
          <Pressable style={[styles.backBtn, { top: topInset + 8 }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercent}% Off</Text>
              </View>
            )}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.star} />
              <Text style={styles.ratingText}>4.5 (365 reviews)</Text>
            </View>
          </View>
          <Text style={styles.hotelName}>{params.hotelName}</Text>
          <Text style={styles.address}>{fullAddress}</Text>
          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>BOOK HOTEL</Text>
          <Text style={styles.fieldLabel}>Check In</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent}>
            {checkInDates.map((d) => {
              const selected = checkIn && d.getTime() === checkIn.getTime();
              return (
                <Pressable
                  key={d.getTime()}
                  style={[styles.dateBtn, selected && styles.dateBtnSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCheckIn(d);
                    if (checkOut && checkOut <= d) setCheckOut(null);
                  }}
                >
                  <Text style={[styles.dateBtnText, selected && styles.dateBtnTextSelected]} numberOfLines={1}>
                    {formatDayLabel(d)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Check Out</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent}>
            {checkOutDates.map((d) => {
              const selected = checkOut && d.getTime() === checkOut.getTime();
              return (
                <Pressable
                  key={d.getTime()}
                  style={[styles.dateBtn, selected && styles.dateBtnSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCheckOut(d);
                  }}
                >
                  <Text style={[styles.dateBtnText, selected && styles.dateBtnTextSelected]} numberOfLines={1}>
                    {formatDayLabel(d)}
                  </Text>
                </Pressable>
              );
            })}
            {checkOutDates.length === 0 && (
              <Text style={styles.hintText}>Select check-in date first</Text>
            )}
          </ScrollView>
          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Note to Owner</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Enter here"
            placeholderTextColor={Colors.textTertiary}
            multiline
          />
        </View>
        <View style={{ height: rs(100) + bottomInset }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + rs(16) }]}>
        <Pressable
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: "center", alignItems: "center", padding: rs(20) },
  errorText: { fontSize: rf(16), color: Colors.textSecondary, marginBottom: rs(16) },
  authSubText: { fontSize: rf(14), color: Colors.textTertiary, marginBottom: rs(20) },
  backBtnStandalone: { backgroundColor: Colors.primary, paddingHorizontal: rs(24), paddingVertical: rs(14), borderRadius: rs(14), marginBottom: rs(12), minHeight: MIN_TOUCH, justifyContent: "center" },
  backLink: { paddingVertical: rs(12), minHeight: MIN_TOUCH, justifyContent: "center" },
  backLinkText: { fontSize: rf(14), color: Colors.primary, fontWeight: "600" as const },
  backBtnStandaloneText: { fontSize: rf(16), fontWeight: "700" as const, color: "#fff" },
  heroWrap: { height: rs(240), position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  backBtn: {
    position: "absolute",
    left: rs(16),
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    marginTop: -rs(24),
    padding: rs(20),
    paddingTop: rs(24),
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: rs(8) },
  discountBadge: { backgroundColor: Colors.primary + "20", paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: rs(8) },
  discountText: { fontSize: rf(13), fontWeight: "700" as const, color: Colors.primary },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: rs(4) },
  ratingText: { fontSize: rf(13), color: Colors.textSecondary, fontWeight: "600" as const },
  hotelName: { fontSize: rf(22), fontWeight: "800" as const, color: Colors.text, marginBottom: rs(4) },
  address: { fontSize: rf(14), color: Colors.textSecondary, marginBottom: rs(16) },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginBottom: rs(20) },
  sectionLabel: { fontSize: rf(12), fontWeight: "700" as const, color: Colors.textTertiary, letterSpacing: 1, marginBottom: rs(16) },
  fieldLabel: { fontSize: rf(16), fontWeight: "700" as const, color: Colors.text, marginBottom: rs(10) },
  dateScroll: { marginHorizontal: -rs(20) },
  dateScrollContent: { paddingHorizontal: rs(20), gap: DATE_GAP, flexDirection: "row", paddingBottom: rs(8) },
  dateBtn: {
    width: DATE_BUTTON_WIDTH,
    paddingVertical: rs(12),
    borderRadius: rs(12),
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    minHeight: MIN_TOUCH,
  },
  dateBtnSelected: { backgroundColor: Colors.primary },
  dateBtnText: { fontSize: rf(13), fontWeight: "600" as const, color: Colors.text },
  dateBtnTextSelected: { color: "#fff" },
  hintText: { fontSize: rf(13), color: Colors.textTertiary, paddingVertical: rs(12) },
  noteInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    fontSize: rf(16),
    color: Colors.text,
    minHeight: rs(100),
    textAlignVertical: "top",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: rs(20),
    paddingTop: rs(12),
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  continueBtn: { backgroundColor: Colors.primary, paddingVertical: rs(16), borderRadius: rs(14), alignItems: "center", minHeight: MIN_TOUCH, justifyContent: "center" },
  continueBtnDisabled: { backgroundColor: Colors.border, opacity: 0.8 },
  continueBtnText: { fontSize: rf(16), fontWeight: "700" as const, color: "#fff" },
});
