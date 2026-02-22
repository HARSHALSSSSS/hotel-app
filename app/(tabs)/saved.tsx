import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  FlatList,
  ScrollView,
  Modal,
} from "react-native";
import { HotelImage } from "@/components/HotelImage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import type { HotelListItem } from "@/lib/app-context";

const FILTERS = ["All", "Recommended", "Popular", "New"] as const;
type FilterType = (typeof FILTERS)[number];

function FavoriteCard({
  hotel,
  onPress,
  onRemovePress,
}: {
  hotel: HotelListItem;
  onPress: () => void;
  onRemovePress: () => void;
}) {
  const discount =
    hotel.originalPrice > hotel.pricePerNight
      ? Math.round(((hotel.originalPrice - hotel.pricePerNight) / hotel.originalPrice) * 100)
      : 0;
  const locationText = `${hotel.city}, ${hotel.country}`;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardImageWrap}>
        <HotelImage
          uri={hotel.images?.[0]}
          size="card"
          style={styles.cardImage}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          recyclingKey={`saved-${hotel.id}`}
        />
        <Pressable
          style={styles.heartOverlay}
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRemovePress();
          }}
          hitSlop={8}
        >
          <Ionicons name="heart" size={rs(20)} color={Colors.primary} />
        </Pressable>
      </View>
      <View style={styles.cardInfo}>
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% Off</Text>
          </View>
        )}
        <Text style={styles.cardName} numberOfLines={1}>
          {hotel.name}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={rs(14)} color={Colors.textSecondary} />
          <Text style={styles.cardLocation} numberOfLines={1}>
            {locationText}
          </Text>
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={rs(14)} color={Colors.star} />
            <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.priceText}>
            ₹{hotel.pricePerNight.toLocaleString("en-IN")}
            <Text style={styles.perNight}> /night</Text>
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function ModalHotelCard({ hotel }: { hotel: HotelListItem }) {
  const discount =
    hotel.originalPrice > hotel.pricePerNight
      ? Math.round(((hotel.originalPrice - hotel.pricePerNight) / hotel.originalPrice) * 100)
      : 0;
  const locationText = `${hotel.city}, ${hotel.country}`;

  return (
    <View style={styles.modalCard}>
      <HotelImage
        uri={hotel.images?.[0]}
        size="card"
        style={styles.modalCardImage}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        recyclingKey={`saved-modal-${hotel.id}`}
      />
      <View style={styles.modalCardInfo}>
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% Off</Text>
          </View>
        )}
        <View style={styles.modalRatingRow}>
          <Ionicons name="star" size={14} color={Colors.star} />
          <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.modalCardName} numberOfLines={1}>
          {hotel.name}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={rs(12)} color={Colors.textSecondary} />
          <Text style={styles.modalCardLocation} numberOfLines={1}>
            {locationText}
          </Text>
        </View>
        <Text style={styles.modalPriceText}>
          ₹{hotel.pricePerNight.toLocaleString("en-IN")}
          <Text style={styles.perNight}> /night</Text>
        </Text>
      </View>
    </View>
  );
}

export default function FavoriteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedHotels, toggleFavorite, refreshSavedHotels, isAuthenticated } = useApp();
  const [filter, setFilter] = useState<FilterType>("All");
  const [removeModalHotel, setRemoveModalHotel] = useState<HotelListItem | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: topInset + rs(12) }]}>
          <Pressable style={styles.headerBtn} onPress={() => router.replace("/(tabs)")}>
            <Ionicons name="arrow-back" size={rs(24)} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Favorite</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={rs(48)} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Sign in to save hotels</Text>
          <Text style={styles.emptyText}>Your favorite hotels will appear here</Text>
          <Pressable style={styles.signInBtn} onPress={() => router.push("/auth/login")}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const filteredList = useMemo(() => {
    if (!savedHotels.length) return [];
    if (filter === "All") return savedHotels;
    if (filter === "Recommended") return [...savedHotels].sort((a, b) => b.rating - a.rating);
    if (filter === "Popular") return [...savedHotels].sort((a, b) => b.reviewCount - a.reviewCount);
    if (filter === "New") return [...savedHotels].sort((a, b) => (b as any).createdAt ? 0 : 0);
    return savedHotels;
  }, [savedHotels, filter]);

  const handleRemoveConfirm = async () => {
    if (!removeModalHotel) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(removeModalHotel.id);
    await refreshSavedHotels();
    setRemoveModalHotel(null);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + rs(12) }]}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace("/(tabs)");
          }}
        >
          <Ionicons name="arrow-back" size={rs(24)} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Favorite</Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/search");
          }}
        >
          <Ionicons name="search-outline" size={rs(24)} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillSelected]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(f);
            }}
            android_ripple={{ color: "rgba(0,0,0,0.1)" }}
          >
            <Text style={[styles.filterPillText, filter === f && styles.filterPillTextSelected]} numberOfLines={1}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {filteredList.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
          <Ionicons name="heart-outline" size={rs(48)} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>Tap the heart on any hotel to add it here</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: rs(24) + bottomInset + rs(80) }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FavoriteCard
              hotel={item}
              onPress={() => router.push({ pathname: "/hotel/[id]", params: { id: item.id } })}
              onRemovePress={() => setRemoveModalHotel(item)}
            />
          )}
        />
      )}

      <Modal visible={!!removeModalHotel} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setRemoveModalHotel(null)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Remove from Favorites?</Text>
            {removeModalHotel && <ModalHotelCard hotel={removeModalHotel} />}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRemoveModalHotel(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalRemoveBtn} onPress={handleRemoveConfirm}>
                <Text style={styles.modalRemoveText}>Yes, Remove</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rs(16),
    paddingBottom: rs(16),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: rf(20), fontWeight: "800" as const, color: Colors.text },
  filterScroll: { maxHeight: rs(52), backgroundColor: "#fff", marginBottom: rs(8) },
  filterContent: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(12),
    gap: rs(12),
    flexDirection: "row",
    alignItems: "center",
  },
  filterPill: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(12),
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    borderRadius: rs(24),
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  filterPillSelected: { backgroundColor: Colors.primary },
  filterPillText: { fontSize: rf(15), fontWeight: "600" as const, color: Colors.textSecondary },
  filterPillTextSelected: { fontSize: rf(15), fontWeight: "600" as const, color: "#fff" },
  list: { padding: rs(20), paddingTop: rs(16) },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: rs(16),
    overflow: "hidden",
    marginBottom: rs(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageWrap: { width: rs(110), height: rs(120), position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  heartOverlay: {
    position: "absolute",
    top: rs(10),
    right: rs(10),
    width: Math.max(rs(28), MIN_TOUCH),
    height: Math.max(rs(28), MIN_TOUCH),
    borderRadius: rs(14),
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, padding: rs(12), justifyContent: "space-between" },
  discountBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: rs(8),
    paddingVertical: rs(4),
    borderRadius: rs(6),
    marginBottom: rs(4),
  },
  discountText: { fontSize: rf(12), fontWeight: "700" as const, color: Colors.primary },
  cardName: { fontSize: rf(16), fontWeight: "800" as const, color: Colors.text, marginBottom: rs(4) },
  locationRow: { flexDirection: "row", alignItems: "center", gap: rs(4) },
  cardLocation: { fontSize: rf(13), color: Colors.textSecondary },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: rs(6) },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: rs(4) },
  ratingText: { fontSize: rf(13), fontWeight: "600" as const, color: Colors.text },
  priceText: { fontSize: rf(15), fontWeight: "700" as const, color: Colors.primary },
  perNight: { fontSize: rf(13), fontWeight: "500" as const, color: Colors.primary, opacity: 0.9 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: rs(100),
    gap: rs(8),
  },
  emptyTitle: { fontSize: rf(18), fontWeight: "700" as const, color: Colors.text, marginTop: rs(8) },
  emptyText: { fontSize: rf(14), color: Colors.textSecondary, textAlign: "center", paddingHorizontal: rs(40) },
  signInBtn: {
    marginTop: rs(20),
    backgroundColor: Colors.primary,
    paddingHorizontal: rs(28),
    paddingVertical: rs(14),
    borderRadius: rs(12),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  signInBtnText: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    padding: rs(24),
    paddingBottom: rs(34),
  },
  modalTitle: { fontSize: rf(18), fontWeight: "800" as const, color: Colors.text, marginBottom: rs(20) },
  modalCard: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: rs(14),
    overflow: "hidden",
    marginBottom: rs(24),
  },
  modalCardImage: { width: rs(90), height: rs(90) },
  modalCardInfo: { flex: 1, padding: rs(12), justifyContent: "center" },
  modalRatingRow: { flexDirection: "row", alignItems: "center", gap: rs(4), marginBottom: rs(4) },
  modalCardName: { fontSize: rf(15), fontWeight: "700" as const, color: Colors.text },
  modalCardLocation: { fontSize: rf(12), color: Colors.textSecondary },
  modalPriceText: { fontSize: rf(14), fontWeight: "700" as const, color: Colors.primary, marginTop: rs(4) },
  modalActions: { flexDirection: "row", gap: rs(12) },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  modalCancelText: { fontSize: rf(16), fontWeight: "700" as const, color: Colors.text },
  modalRemoveBtn: {
    flex: 1,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
    alignItems: "center",
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  modalRemoveText: { fontSize: rf(16), fontWeight: "700" as const, color: "#fff" },
});
