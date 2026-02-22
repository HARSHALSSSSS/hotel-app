import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
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

export default function ReviewSummaryScreen() {
  const params = useLocalSearchParams<{
    hotelId: string;
    roomId: string;
    roomName: string;
    roomPrice: string;
    hotelName: string;
    hotelImage: string;
    checkIn: string;
    checkOut: string;
    note?: string;
    adults: string;
    children: string;
    infants: string;
    guestName: string;
    guestEmail: string;
    guestGender: string;
    guestPhone: string;
    guestCountry: string;
    paymentMethod: string;
    cardLast4?: string;
  }>();
  const { createBooking, createBookingWithRazorpay, refreshUser } = useApp();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const nights = useMemo(() => {
    if (!params.checkIn || !params.checkOut) return 0;
    const a = new Date(params.checkIn);
    const b = new Date(params.checkOut);
    return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)));
  }, [params.checkIn, params.checkOut]);

  const guests = useMemo(() => {
    const a = parseInt(params.adults || "1", 10);
    const c = parseInt(params.children || "0", 10);
    const i = parseInt(params.infants || "0", 10);
    return a + c + i;
  }, [params.adults, params.children, params.infants]);

  const pricePerNight = parseFloat(params.roomPrice || "0");
  const amount = pricePerNight * nights;
  const taxesAndFees = Math.round(amount * 0.12) + 25;
  const total = amount + taxesAndFees;

  const bookingDateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + " | " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const checkInStr = params.checkIn ? new Date(params.checkIn).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const checkOutStr = params.checkOut ? new Date(params.checkOut).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

  const paymentLabel = params.paymentMethod === "card"
    ? (params.cardLast4 ? `Card **** ${params.cardLast4}` : "Pay with Card")
    : params.paymentMethod === "wallet"
      ? "Wallet"
      : params.paymentMethod === "phonepay"
        ? "Phone Pay"
        : params.paymentMethod === "apple"
          ? "Apple Pay"
          : params.paymentMethod === "google"
            ? "Google Pay"
            : "Cash";

  const paymentIcon = params.paymentMethod === "card" ? "card-outline" : params.paymentMethod === "wallet" ? "wallet-outline" : params.paymentMethod === "phonepay" ? "phone-portrait-outline" : params.paymentMethod === "apple" ? "logo-apple" : params.paymentMethod === "google" ? "logo-google" : "cash-outline";

  const handleChangePayment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { paymentMethod, cardLast4, ...rest } = params;
    router.push({ pathname: "/booking/payment", params: rest });
  };

  const handleContinue = async () => {
    if (!params.hotelId || !params.roomId || !params.checkIn || !params.checkOut) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const bookingData = {
        hotelId: params.hotelId,
        roomId: params.roomId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests,
        nights,
      };

      let booking: { id: string; paymentId?: string } | null = null;
      if (params.paymentMethod === "card") {
        booking = (await createBookingWithRazorpay(bookingData, total)) as { id: string; paymentId?: string };
      } else if (params.paymentMethod === "phonepay") {
        booking = (await createBookingWithRazorpay(bookingData, total, "phonepe")) as { id: string; paymentId?: string };
      } else if (params.paymentMethod === "google") {
        booking = (await createBookingWithRazorpay(bookingData, total, "gpay")) as { id: string; paymentId?: string };
      } else {
        const method = params.paymentMethod === "wallet" ? "wallet" : "on_arrival";
        booking = await createBooking({ ...bookingData, paymentMethod: method });
      }
      if (params.paymentMethod === "wallet") await refreshUser();
      const transactionId = booking?.paymentId
        ? `#RE-${String(booking.paymentId)}`
        : `#RE-${String(booking?.id ?? "")}`;
      router.replace({
        pathname: "/booking/receipt",
        params: {
          bookingId: booking?.id ?? "",
          transactionId: transactionId || `#RE-T${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
          hotelName: params.hotelName ?? "",
          checkIn: params.checkIn ?? "",
          checkOut: params.checkOut ?? "",
          guests: guests.toString(),
          amount: amount.toFixed(2),
          taxesAndFees: taxesAndFees.toFixed(2),
          total: total.toFixed(2),
          guestName: params.guestName ?? "",
          guestPhone: params.guestPhone ?? "",
        },
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
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

  const discountPercent = 20;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Review Summary</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomInset }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hotelCard}>
          <Image
            source={{ uri: getOptimizedImageUrl(params.hotelImage, "card") || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80" }}
            style={styles.hotelImage}
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
          />
          <View style={styles.hotelInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercent}% Off</Text>
              </View>
              <View style={styles.ratingWrap}>
                <Ionicons name="star" size={14} color={Colors.star} />
                <Text style={styles.ratingText}>4.5</Text>
              </View>
            </View>
            <Text style={styles.hotelName}>{params.hotelName}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.locationText}>New York, USA</Text>
            </View>
            <Text style={styles.priceText}>₹{pricePerNight.toLocaleString("en-IN")} /night</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booking Date</Text>
          <Text style={styles.detailValue}>{bookingDateStr}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Check In</Text>
          <Text style={styles.detailValue}>{checkInStr}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Check Out</Text>
          <Text style={styles.detailValue}>{checkOutStr}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Guest</Text>
          <Text style={styles.detailValue}>{guests} Person</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Price Breakdown</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>₹{amount.toLocaleString("en-IN")}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tax & Fees</Text>
          <Text style={styles.detailValue}>₹{taxesAndFees.toLocaleString("en-IN")}</Text>
        </View>
        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total.toLocaleString("en-IN")}</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Payment Method</Text>
        <View style={styles.paymentRow}>
          <View style={styles.paymentLeft}>
            <View style={styles.paymentIconWrap}>
              <Ionicons name={paymentIcon as any} size={22} color={Colors.primary} />
            </View>
            <Text style={styles.paymentMethodText}>{paymentLabel}</Text>
          </View>
          <Pressable onPress={handleChangePayment}>
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
        <Pressable style={[styles.continueBtn, loading && styles.continueBtnDisabled]} onPress={handleContinue} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueBtnText}>Continue</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: "center", alignItems: "center", padding: rs(20) },
  errorText: { fontSize: rf(16), color: Colors.textSecondary, marginBottom: rs(16) },
  backBtnStandalone: { backgroundColor: Colors.primary, paddingHorizontal: rs(24), paddingVertical: rs(14), borderRadius: rs(14) },
  backBtnStandaloneText: { fontSize: rf(16), fontWeight: "700" as const, color: "#fff" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: rs(16), paddingBottom: rs(16), backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: Math.max(rs(40), MIN_TOUCH), height: Math.max(rs(40), MIN_TOUCH), borderRadius: rs(20), backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: rf(18), fontWeight: "700" as const, color: Colors.text },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: rs(20), paddingTop: rs(24) },
  hotelCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: rs(16), overflow: "hidden", marginBottom: rs(24) },
  hotelImage: { width: rs(100), height: rs(110) },
  hotelInfo: { flex: 1, padding: rs(12), justifyContent: "center" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: rs(8), marginBottom: rs(4) },
  discountBadge: { backgroundColor: Colors.primary + "20", paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(6) },
  discountText: { fontSize: rf(12), fontWeight: "700" as const, color: Colors.primary },
  ratingWrap: { flexDirection: "row", alignItems: "center", gap: rs(4) },
  ratingText: { fontSize: rf(13), fontWeight: "600" as const, color: Colors.text },
  hotelName: { fontSize: rf(16), fontWeight: "800" as const, color: Colors.text, marginBottom: rs(4) },
  locationRow: { flexDirection: "row", alignItems: "center", gap: rs(4), marginBottom: rs(4) },
  locationText: { fontSize: rf(13), color: Colors.textSecondary },
  priceText: { fontSize: rf(14), fontWeight: "700" as const, color: Colors.primary },
  sectionTitle: { fontSize: rf(14), fontWeight: "700" as const, color: Colors.text, marginBottom: rs(12) },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: rs(10) },
  detailLabel: { fontSize: rf(14), color: Colors.textSecondary },
  detailValue: { fontSize: rf(14), fontWeight: "600" as const, color: Colors.text },
  totalRow: { marginTop: rs(6), paddingTop: rs(10), borderTopWidth: 1, borderTopColor: Colors.borderLight },
  totalLabel: { fontSize: rf(16), fontWeight: "800" as const, color: Colors.text },
  totalValue: { fontSize: rf(16), fontWeight: "800" as const, color: Colors.text },
  paymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: rs(14), padding: rs(16) },
  paymentLeft: { flexDirection: "row", alignItems: "center", gap: rs(12) },
  paymentIconWrap: { width: rs(40), height: rs(40), borderRadius: rs(10), backgroundColor: Colors.primary + "18", alignItems: "center", justifyContent: "center" },
  paymentMethodText: { fontSize: rf(16), fontWeight: "600" as const, color: Colors.text },
  changeText: { fontSize: rf(15), fontWeight: "600" as const, color: Colors.primary },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: rs(20), paddingTop: rs(12), backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: Colors.borderLight },
  continueBtn: { backgroundColor: Colors.primary, paddingVertical: rs(16), borderRadius: rs(14), alignItems: "center", minHeight: MIN_TOUCH, justifyContent: "center" },
  continueBtnDisabled: { opacity: 0.8 },
  continueBtnText: { fontSize: rf(16), fontWeight: "700" as const, color: "#fff" },
});
