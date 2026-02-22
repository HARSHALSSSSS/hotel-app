import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { getOptimizedImageUrl } from "@/lib/image-utils";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import type { BookingItem } from "@/lib/app-context";

type TabKey = "upcoming" | "completed" | "cancelled";

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function filterByTab(bookings: BookingItem[], tab: TabKey): BookingItem[] {
  const now = todayStart();
  return bookings.filter((b) => {
    const status = b.status;
    const checkOut = new Date(b.checkOut).getTime();
    if (tab === "upcoming") {
      return status === "confirmed" && checkOut >= now;
    }
    if (tab === "completed") {
      return status === "completed" || (status === "confirmed" && checkOut < now);
    }
    return status === "cancelled";
  });
}

function BookingCardUpcoming({
  booking,
  onCancel,
  onReceipt,
}: {
  booking: BookingItem;
  onCancel: (b: BookingItem) => void;
  onReceipt: (b: BookingItem) => void;
}) {
  const pricePerNight = (booking.nights && booking.nights > 0)
    ? booking.totalPrice / booking.nights
    : booking.totalPrice;
  const location = booking.location || "—";
  const rating = booking.rating ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        <ExpoImage
          source={{ uri: getOptimizedImageUrl(booking.hotelImage, "card") || "https://via.placeholder.com/400" }}
          style={styles.cardImage}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={`profile-booking-${booking.id}`}
        />
        <View style={styles.heartWrap}>
          <Ionicons name="heart" size={18} color={Colors.primary} />
        </View>
        <View style={styles.discountTag}>
          <Text style={styles.discountText}>10% Off</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.hotelName} numberOfLines={1}>{booking.hotelName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.star} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
        </View>
        <Text style={styles.priceRow}>
          <Text style={styles.priceValue}>₹{pricePerNight.toLocaleString("en-IN")}</Text>
          <Text style={styles.priceSuffix}>/night</Text>
        </Text>
        <View style={styles.actionRow}>
          <Pressable
            style={styles.btnOutline}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onCancel(booking);
            }}
          >
            <Text style={styles.btnOutlineText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={styles.btnPrimary}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onReceipt(booking);
            }}
          >
            <Text style={styles.btnPrimaryText}>E-Receipt</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function BookingCardCompleted({
  booking,
  onReBook,
  onAddReview,
}: {
  booking: BookingItem;
  onReBook: (b: BookingItem) => void;
  onAddReview: (b: BookingItem) => void;
}) {
  const pricePerNight = (booking.nights && booking.nights > 0)
    ? booking.totalPrice / booking.nights
    : booking.totalPrice;
  const location = booking.location || "—";
  const rating = booking.rating ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        <ExpoImage
          source={{ uri: getOptimizedImageUrl(booking.hotelImage, "card") || "https://via.placeholder.com/400" }}
          style={styles.cardImage}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={`profile-booking-${booking.id}`}
        />
        <View style={styles.heartWrap}>
          <Ionicons name="heart" size={18} color={Colors.primary} />
        </View>
        <View style={styles.discountTag}>
          <Text style={styles.discountText}>10% Off</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.hotelName} numberOfLines={1}>{booking.hotelName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.star} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
        </View>
        <Text style={styles.priceRow}>
          <Text style={styles.priceValue}>₹{pricePerNight.toLocaleString("en-IN")}</Text>
          <Text style={styles.priceSuffix}>/night</Text>
        </Text>
        <View style={styles.actionRow}>
          <Pressable style={styles.btnOutline} onPress={() => onReBook(booking)}>
            <Text style={styles.btnOutlineText}>Re-Book</Text>
          </Pressable>
          <Pressable style={styles.btnPrimary} onPress={() => onAddReview(booking)}>
            <Text style={styles.btnPrimaryText}>Add Review</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function BookingCardCancelled({
  booking,
  onReBook,
}: {
  booking: BookingItem;
  onReBook: (b: BookingItem) => void;
}) {
  const pricePerNight = (booking.nights && booking.nights > 0)
    ? booking.totalPrice / booking.nights
    : booking.totalPrice;
  const location = booking.location || "—";
  const rating = booking.rating ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        <ExpoImage
          source={{ uri: getOptimizedImageUrl(booking.hotelImage, "card") || "https://via.placeholder.com/400" }}
          style={styles.cardImage}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={`profile-booking-${booking.id}`}
        />
        <View style={styles.heartWrap}>
          <Ionicons name="heart" size={18} color={Colors.primary} />
        </View>
        <View style={styles.discountTag}>
          <Text style={styles.discountText}>10% Off</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.hotelName} numberOfLines={1}>{booking.hotelName}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.star} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
        </View>
        <Text style={styles.priceRow}>
          <Text style={styles.priceValue}>₹{pricePerNight.toLocaleString("en-IN")}</Text>
          <Text style={styles.priceSuffix}>/night</Text>
        </Text>
        <Pressable style={styles.btnPrimaryFull} onPress={() => onReBook(booking)}>
          <Text style={styles.btnPrimaryText}>Re-Book</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { bookings, refreshBookings } = useApp();
  const [tab, setTab] = useState<TabKey>("upcoming");
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => filterByTab(bookings, tab), [bookings, tab]);

  const onCancel = (booking: BookingItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/profile/cancel-booking", params: { bookingId: booking.id } });
  };

  const onReceipt = (booking: BookingItem) => {
    router.push({ pathname: "/booking/[id]", params: { id: booking.id } });
  };

  const onReBook = (booking: BookingItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/hotel/[id]", params: { id: booking.hotelId } });
  };

  const onAddReview = (booking: BookingItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/hotel/add-review",
      params: { hotelId: booking.hotelId, bookingId: booking.id },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabs}>
        {(["upcoming", "completed", "cancelled"] as const).map((t) => (
          <Pressable
            key={t}
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTab(t);
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "upcoming" ? "Upcoming" : t === "completed" ? "Completed" : "Cancelled"}
            </Text>
            {tab === t && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: 80 + bottomInset }]}>
          <Ionicons name="calendar-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>
            {tab === "upcoming" && "No upcoming bookings"}
            {tab === "completed" && "No completed bookings"}
            {tab === "cancelled" && "No cancelled bookings"}
          </Text>
          <Text style={styles.emptySub}>
            {tab === "upcoming" && "Your confirmed stays will appear here."}
            {tab === "completed" && "Past stays will appear here."}
            {tab === "cancelled" && "Cancelled reservations will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 24 + bottomInset }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (tab === "upcoming") {
              return (
                <BookingCardUpcoming
                  booking={item}
                  onCancel={onCancel}
                  onReceipt={onReceipt}
                />
              );
            }
            if (tab === "completed") {
              return (
                <BookingCardCompleted
                  booking={item}
                  onReBook={onReBook}
                  onAddReview={onAddReview}
                />
              );
            }
            return <BookingCardCancelled booking={item} onReBook={onReBook} />;
          }}
        />
      )}
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
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabText: { fontSize: 15, fontWeight: "500" as const, color: Colors.textSecondary },
  tabTextActive: { fontWeight: "700" as const, color: Colors.primary },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  list: { padding: 20, paddingTop: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImageWrap: {
    width: 120,
    height: 140,
    position: "relative",
  },
  cardImage: { width: "100%", height: "100%" },
  heartWrap: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  discountTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(27, 75, 102, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: { fontSize: 11, fontWeight: "600" as const, color: "#fff" },
  cardBody: { flex: 1, padding: 12, justifyContent: "space-between" },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  hotelName: { fontSize: 16, fontWeight: "700" as const, color: Colors.text, flex: 1, marginRight: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 13, fontWeight: "600" as const, color: Colors.text },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  locationText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  priceRow: { marginBottom: 10 },
  priceValue: { fontSize: 16, fontWeight: "700" as const, color: Colors.primary },
  priceSuffix: { fontSize: 13, color: Colors.text, marginLeft: 2 },
  actionRow: { flexDirection: "row", gap: 10 },
  btnOutline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  btnOutlineText: { fontSize: 14, fontWeight: "600" as const, color: Colors.primary },
  btnPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  btnPrimaryFull: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  btnPrimaryText: { fontSize: 14, fontWeight: "600" as const, color: "#fff" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" as const, color: Colors.text, marginTop: 16, textAlign: "center" },
  emptySub: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: "center" },
});
