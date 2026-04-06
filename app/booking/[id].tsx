import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import type { BookingItem } from "@/lib/app-context";

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getBookingById, cancelBooking } = useApp();
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (!id) return;
    getBookingById(id).then(setBooking).finally(() => setLoading(false));
  }, [id, getBookingById]);

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Cancel booking",
      "Are you sure you want to cancel this reservation?",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            if (!booking?.id) return;
            setCancelling(true);
            try {
              await cancelBooking(booking.id);
              Alert.alert("Booking Cancelled", "Your reservation has been cancelled.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to cancel. Please try again.");
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Booking not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const checkIn = new Date(booking.checkIn).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const checkOut = new Date(booking.checkOut).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const statusColor =
    { confirmed: Colors.success, completed: Colors.primary, cancelled: Colors.error }[booking.status] ?? Colors.textSecondary;
  const canCancel = booking.status === "confirmed";

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Image source={{ uri: booking.hotelImage }} style={styles.image} contentFit="cover" />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.hotelName}>{booking.hotelName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{booking.status}</Text>
              </View>
            </View>
            <Text style={styles.roomName}>{booking.roomName}</Text>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Check-in</Text>
                <Text style={styles.detailValue}>{checkIn}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Check-out</Text>
                <Text style={styles.detailValue}>{checkOut}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={18} color={Colors.primary} />
              <Text style={styles.detailValue}>{booking.guests} guests</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{Number(booking.totalPrice).toLocaleString("en-IN")}</Text>
            </View>
          </View>
        </View>

        {/* E-Receipt button */}
        <Pressable
          style={styles.eReceiptBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const taxes = booking.totalPrice ? Math.round(Number(booking.totalPrice) * 0.12) : 0;
            const serviceFee = 25;
            const amount = Number(booking.totalPrice) - taxes - serviceFee;
            router.push({
              pathname: "/booking/receipt",
              params: {
                bookingId: booking.id,
                transactionId: `#RE-${booking.id}`,
                hotelName: booking.hotelName || "",
                checkIn: booking.checkIn || "",
                checkOut: booking.checkOut || "",
                guests: String(booking.guests || 1),
                amount: amount.toFixed(2),
                taxesAndFees: (taxes + serviceFee).toFixed(2),
                total: String(booking.totalPrice || 0),
                guestName: "",
                guestPhone: "",
              },
            });
          }}
        >
          <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
          <Text style={styles.eReceiptBtnText}>View E-Receipt</Text>
        </Pressable>

        {canCancel && (
          <Pressable
            style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color={Colors.error} size="small" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
                <Text style={styles.cancelBtnText}>Cancel booking</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable
          style={styles.viewHotelBtn}
          onPress={() => router.push({ pathname: "/hotel/[id]", params: { id: booking.hotelId } })}
        >
          <Ionicons name="business-outline" size={20} color={Colors.primary} />
          <Text style={styles.viewHotelBtnText}>View hotel</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.primary,
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
  headerBackBtn: {
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
  scroll: {
    flex: 1,
  },
  card: {
    margin: 20,
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 180,
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  roomName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  eReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
    marginBottom: 12,
  },
  eReceiptBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.error + "40",
    backgroundColor: Colors.error + "08",
  },
  cancelBtnDisabled: {
    opacity: 0.7,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.error,
  },
  viewHotelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  viewHotelBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
