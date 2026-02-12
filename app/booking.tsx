import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import { Booking } from "@/lib/hotel-data";

export default function BookingScreen() {
  const params = useLocalSearchParams<{
    hotelId: string;
    roomId: string;
    roomName: string;
    roomPrice: string;
    hotelName: string;
    hotelImage: string;
  }>();
  const insets = useSafeAreaInsets();
  const { addBooking } = useApp();
  const [guests, setGuests] = useState(2);
  const [nights, setNights] = useState(3);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const pricePerNight = parseInt(params.roomPrice || "0");
  const subtotal = pricePerNight * nights;
  const taxes = Math.round(subtotal * 0.12);
  const serviceFee = 25;
  const total = subtotal + taxes + serviceFee;

  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + nights);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleBook = async () => {
    setIsBooking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    await new Promise((r) => setTimeout(r, 1500));

    const booking: Booking = {
      id: Crypto.randomUUID(),
      hotelId: params.hotelId,
      hotelName: params.hotelName,
      hotelImage: params.hotelImage,
      roomName: params.roomName,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      guests,
      totalPrice: total,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    await addBooking(booking);
    setBookingComplete(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (bookingComplete) {
    return (
      <View style={[styles.successContainer, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your reservation at {params.hotelName} has been confirmed.
          </Text>
          <View style={styles.successCard}>
            <Image source={{ uri: params.hotelImage }} style={styles.successImage} contentFit="cover" transition={300} />
            <View style={styles.successInfo}>
              <Text style={styles.successHotelName}>{params.hotelName}</Text>
              <Text style={styles.successRoom}>{params.roomName}</Text>
              <Text style={styles.successDates}>
                {formatDate(checkIn)} - {formatDate(checkOut)}
              </Text>
              <Text style={styles.successTotal}>${total}</Text>
            </View>
          </View>
          <View style={styles.successActions}>
            <Pressable style={styles.viewBookingsBtn} onPress={() => router.replace("/(tabs)/bookings")}>
              <Text style={styles.viewBookingsText}>View My Bookings</Text>
            </Pressable>
            <Pressable style={styles.backHomeBtn} onPress={() => router.replace("/(tabs)")}>
              <Text style={styles.backHomeText}>Back to Home</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.hotelCard}>
          <Image source={{ uri: params.hotelImage }} style={styles.hotelImage} contentFit="cover" transition={300} />
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{params.hotelName}</Text>
            <Text style={styles.roomName}>{params.roomName}</Text>
            <Text style={styles.pricePerNight}>
              ${pricePerNight}<Text style={styles.perNightUnit}>/night</Text>
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Stay Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                <View>
                  <Text style={styles.detailLabel}>Check-in</Text>
                  <Text style={styles.detailValue}>{formatDate(checkIn)}</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                <View>
                  <Text style={styles.detailLabel}>Check-out</Text>
                  <Text style={styles.detailValue}>{formatDate(checkOut)}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Guests & Duration</Text>
          <View style={styles.detailCard}>
            <View style={styles.counterRow}>
              <Text style={styles.counterLabel}>Guests</Text>
              <View style={styles.counter}>
                <Pressable
                  style={[styles.counterBtn, guests <= 1 && styles.counterBtnDisabled]}
                  onPress={() => {
                    if (guests > 1) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGuests(guests - 1);
                    }
                  }}
                >
                  <Ionicons name="remove" size={18} color={guests <= 1 ? Colors.textTertiary : Colors.primary} />
                </Pressable>
                <Text style={styles.counterValue}>{guests}</Text>
                <Pressable
                  style={[styles.counterBtn, guests >= 6 && styles.counterBtnDisabled]}
                  onPress={() => {
                    if (guests < 6) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGuests(guests + 1);
                    }
                  }}
                >
                  <Ionicons name="add" size={18} color={guests >= 6 ? Colors.textTertiary : Colors.primary} />
                </Pressable>
              </View>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.counterRow}>
              <Text style={styles.counterLabel}>Nights</Text>
              <View style={styles.counter}>
                <Pressable
                  style={[styles.counterBtn, nights <= 1 && styles.counterBtnDisabled]}
                  onPress={() => {
                    if (nights > 1) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNights(nights - 1);
                    }
                  }}
                >
                  <Ionicons name="remove" size={18} color={nights <= 1 ? Colors.textTertiary : Colors.primary} />
                </Pressable>
                <Text style={styles.counterValue}>{nights}</Text>
                <Pressable
                  style={[styles.counterBtn, nights >= 30 && styles.counterBtnDisabled]}
                  onPress={() => {
                    if (nights < 30) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNights(nights + 1);
                    }
                  }}
                >
                  <Ionicons name="add" size={18} color={nights >= 30 ? Colors.textTertiary : Colors.primary} />
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.detailCard}>
            <View style={styles.priceLineItem}>
              <Text style={styles.priceLabel}>${pricePerNight} x {nights} nights</Text>
              <Text style={styles.priceValue}>${subtotal}</Text>
            </View>
            <View style={styles.priceLineItem}>
              <Text style={styles.priceLabel}>Taxes & fees (12%)</Text>
              <Text style={styles.priceValue}>${taxes}</Text>
            </View>
            <View style={styles.priceLineItem}>
              <Text style={styles.priceLabel}>Service fee</Text>
              <Text style={styles.priceValue}>${serviceFee}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.priceLineItem}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 8 }]}>
        <View>
          <Text style={styles.bottomTotal}>${total}</Text>
          <Text style={styles.bottomSubtext}>{nights} nights, {guests} guests</Text>
        </View>
        <Pressable
          style={[styles.confirmBtn, isBooking && styles.confirmBtnLoading]}
          onPress={handleBook}
          disabled={isBooking}
        >
          <Text style={styles.confirmBtnText}>
            {isBooking ? "Processing..." : "Confirm Booking"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  hotelCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  hotelImage: {
    width: 100,
    height: 100,
  },
  hotelInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  hotelName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  roomName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  pricePerNight: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  perNightUnit: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginTop: 2,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  counterLabel: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnDisabled: {
    borderColor: Colors.border,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    minWidth: 24,
    textAlign: "center",
  },
  counterDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  priceLineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomTotal: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  bottomSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmBtnLoading: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successContent: {
    alignItems: "center",
    width: "100%",
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  successCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 28,
  },
  successImage: {
    width: 100,
    height: 100,
  },
  successInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  successHotelName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  successRoom: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  successDates: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  successTotal: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  successActions: {
    width: "100%",
    gap: 10,
  },
  viewBookingsBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  viewBookingsText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
  backHomeBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  backHomeText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
});
