import React from "react";
import { StyleSheet, View, Text, FlatList, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { getOptimizedImageUrl, FALLBACK_HOTEL_IMAGE } from "@/lib/image-utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import { Booking } from "@/lib/hotel-data";

function BookingCard({ booking, index }: { booking: Booking; index: number }) {
  const { getHotelById } = useApp();
  const statusColor = (
    {
      confirmed: Colors.success,
      completed: Colors.primary,
      cancelled: Colors.error,
      pending: Colors.warning,
    } as Record<string, string>
  )[booking.status] ?? Colors.textSecondary;

  const statusLabel = (
    {
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      pending: "Pending",
    } as Record<string, string>
  )[booking.status] ?? booking.status;

  const checkIn = new Date(booking.checkIn).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const checkOut = new Date(booking.checkOut).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <Pressable
        style={styles.bookingCard}
        onPress={() => router.push({ pathname: "/booking/[id]", params: { id: booking.id } })}
      >
        <Image
          source={{ uri: getOptimizedImageUrl(getHotelById(booking.hotelId)?.images?.[0], "card") || getOptimizedImageUrl(booking.hotelImage, "card") || FALLBACK_HOTEL_IMAGE }}
          style={styles.bookingImage}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={`booking-${booking.id}`}
        />
        <View style={styles.bookingInfo}>
          <View style={styles.bookingHeader}>
            <Text style={styles.bookingName} numberOfLines={1}>{booking.hotelName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.bookingRoom}>{booking.roomName}</Text>
          <View style={styles.bookingDates}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.dateText}>{checkIn} - {checkOut}</Text>
          </View>
          <View style={styles.bookingBottom}>
            <Text style={styles.guestText}>{booking.guests} guests</Text>
            <Text style={styles.bookingTotal}>₹{Number(booking.totalPrice).toLocaleString("en-IN")}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const { bookings, isAuthenticated } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.empty]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={styles.title}>My Bookings</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Sign in to view bookings</Text>
          <Text style={styles.emptyText}>Your booking history will appear here</Text>
          <Pressable style={styles.signInBtn} onPress={() => router.push("/auth/login")}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>{bookings.length} bookings</Text>
      </View>

      {bookings.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyText}>
            Your booking history will appear here after you make a reservation
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => <BookingCard booking={item} index={index} />}
          ListFooterComponent={<View style={{ height: Platform.OS === "web" ? 34 : 100 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  list: {
    padding: 20,
  },
  bookingCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingImage: {
    width: 100,
    height: 120,
  },
  bookingInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bookingName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700" as const,
  },
  bookingRoom: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bookingDates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bookingBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  guestText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  bookingTotal: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  signInBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signInBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
