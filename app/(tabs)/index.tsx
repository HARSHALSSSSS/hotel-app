import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { HotelImage } from "@/components/HotelImage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import type { HotelListItem } from "@/lib/app-context";

const RECOMMENDED_CARD_WIDTH = rs(200);
const RECOMMENDED_CARD_GAP = rs(14);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { unreadCount, hotels, featuredHotels, refreshHotels, isFavorite, toggleFavorite, locationDisplayName, isLoading, hotelsLoading } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const locationLabel = locationDisplayName || "Tap to set location";

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const recommendedHotels = featuredHotels.length > 0 ? featuredHotels : hotels.slice(0, 4);
  const nearbyHotels = featuredHotels.length > 0
    ? hotels.filter((h) => !featuredHotels.some((f) => f.id === h.id)).slice(0, 10)
    : hotels.slice(4, 14);
  const displayNearby = nearbyHotels.length > 0 ? nearbyHotels : hotels.slice(0, 6);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHotels();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Animated.View entering={FadeIn.duration(300)} style={[styles.header, { paddingTop: topInset + rs(16) }]}>
          <View style={styles.headerTop}>
            <View style={styles.locationBlock}>
              <Text style={styles.locationLabel}>Location</Text>
              <Pressable
                style={styles.locationRow}
                onPress={() => router.push("/enter-location")}
              >
                <Ionicons name="location" size={rs(18)} color={Colors.primary} />
                <Text style={styles.locationText}>{locationLabel}</Text>
                <Ionicons name="chevron-down" size={rs(16)} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable
              style={styles.notifButton}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons name="notifications-outline" size={rs(24)} color={Colors.text} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Pressable
              style={styles.searchBar}
              onPress={() => router.push("/(tabs)/search")}
            >
              <Ionicons name="search" size={rs(20)} color={Colors.textSecondary} />
              <Text style={styles.searchPlaceholder}>Search</Text>
            </Pressable>
            <Pressable
              style={styles.filterButton}
              onPress={() => router.push("/filter")}
            >
              <Ionicons name="options-outline" size={rs(22)} color={Colors.textInverse} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(280)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Hotel</Text>
            <Pressable onPress={() => router.push("/(tabs)/search")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedRow}
          >
            {recommendedHotels.length === 0 && (isLoading || hotelsLoading) ? (
              <View style={styles.recommendedPlaceholder}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.recommendedPlaceholderText}>Loading...</Text>
              </View>
            ) : (
              recommendedHotels.map((hotel, idx) => (
                <RecommendedCard key={hotel.id} hotel={hotel} index={idx} />
              ))
            )}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(280)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Hotel</Text>
            <Pressable onPress={() => router.push("/(tabs)/search")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.nearbyList}>
            {displayNearby.length === 0 ? (
              isLoading || hotelsLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.emptySub}>Loading hotels...</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="cloud-offline-outline" size={rs(48)} color={Colors.textTertiary} />
                  <Text style={styles.emptyTitle}>Unable to load hotels</Text>
                  <Text style={styles.emptySub}>Connection may be slow. Pull down to try again</Text>
                </View>
              )
            ) : (
              displayNearby.map((hotel, idx) => (
                <NearbyCard key={hotel.id} hotel={hotel} index={idx} />
              ))
            )}
          </View>
        </Animated.View>

        <View style={{ height: Platform.OS === "web" ? rs(34) : rs(100) }} />
      </ScrollView>
    </View>
  );
}

function RecommendedCard({ hotel, index }: { hotel: HotelListItem; index: number }) {
  const { isFavorite, toggleFavorite } = useApp();
  const saved = isFavorite(hotel.id);
  const discount =
    hotel.originalPrice > hotel.pricePerNight
      ? Math.round(((hotel.originalPrice - hotel.pricePerNight) / hotel.originalPrice) * 100)
      : 10;
  const locationText = hotel.city && hotel.country ? `${hotel.city}, ${hotel.country}` : hotel.location;

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(280)}>
      <Pressable
        style={styles.recommendedCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/hotel/[id]", params: { id: hotel.id } });
        }}
      >
        <HotelImage
          uri={hotel.images?.[0]}
          size="card"
          style={styles.recommendedImage}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey={`rec-${hotel.id}`}
          placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
        />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}% Off</Text>
        </View>
        <Pressable
          style={styles.heartButton}
          onPress={() => toggleFavorite(hotel.id)}
          hitSlop={8}
        >
          <View style={styles.heartCircle}>
            <Ionicons name={saved ? "heart" : "heart-outline"} size={rs(16)} color={saved ? Colors.error : "#fff"} />
          </View>
        </Pressable>
        <View style={styles.recommendedInfo}>
          <Text style={styles.recommendedName} numberOfLines={1}>{hotel.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={rs(14)} color={Colors.star} />
            <Text style={styles.ratingText}>{hotel.rating}</Text>
            <Ionicons name="location-outline" size={rs(12)} color={Colors.textSecondary} />
            <Text style={styles.locText} numberOfLines={1}>{locationText}</Text>
          </View>
          <Text style={styles.priceText}>
            ₹{hotel.pricePerNight.toLocaleString("en-IN")}
            <Text style={styles.priceUnit}> /night</Text>
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function NearbyCard({ hotel, index }: { hotel: HotelListItem; index: number }) {
  const { isFavorite, toggleFavorite } = useApp();
  const saved = isFavorite(hotel.id);
  const discount =
    hotel.originalPrice > hotel.pricePerNight
      ? Math.round(((hotel.originalPrice - hotel.pricePerNight) / hotel.originalPrice) * 100)
      : 10;
  const locationText = hotel.city && hotel.country ? `${hotel.city}, ${hotel.country}` : hotel.location;

  return (
    <Animated.View entering={FadeInDown.delay(index * 25).duration(280)}>
      <Pressable
        style={styles.nearbyCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: "/hotel/[id]", params: { id: hotel.id } });
        }}
      >
        <View style={styles.nearbyImageWrap}>
          <HotelImage
            uri={hotel.images?.[0]}
            size="card"
            style={styles.nearbyImage}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            priority={index < 6 ? "high" : "normal"}
            recyclingKey={`nearby-${hotel.id}`}
            placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
          />
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% Off</Text>
          </View>
          <Pressable
            style={styles.heartButton}
            onPress={() => toggleFavorite(hotel.id)}
            hitSlop={8}
          >
            <View style={styles.heartCircle}>
              <Ionicons name={saved ? "heart" : "heart-outline"} size={rs(16)} color={saved ? Colors.error : "#fff"} />
            </View>
          </Pressable>
        </View>
        <View style={styles.nearbyInfo}>
          <Text style={styles.nearbyName} numberOfLines={1}>{hotel.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={rs(14)} color={Colors.star} />
            <Text style={styles.ratingText}>{hotel.rating}</Text>
            <Ionicons name="location-outline" size={rs(12)} color={Colors.textSecondary} />
            <Text style={styles.locText} numberOfLines={1}>{locationText}</Text>
          </View>
          <Text style={styles.priceText}>
            ₹{hotel.pricePerNight.toLocaleString("en-IN")}
            <Text style={styles.priceUnit}> /night</Text>
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: rs(20),
    paddingBottom: rs(20),
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  locationBlock: {},
  locationLabel: {
    fontSize: rf(12),
    color: Colors.textSecondary,
    marginBottom: rs(4),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  locationText: {
    fontSize: rf(15),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  notifButton: {
    width: Math.max(rs(44), MIN_TOUCH),
    height: Math.max(rs(44), MIN_TOUCH),
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: rs(4),
    right: rs(4),
    minWidth: rs(18),
    height: rs(18),
    borderRadius: rs(9),
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: rs(4),
  },
  badgeText: {
    fontSize: rf(10),
    fontWeight: "700" as const,
    color: "#fff",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(12),
    marginTop: rs(16),
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    paddingVertical: Platform.OS === "ios" ? rs(12) : rs(10),
    gap: rs(10),
  },
  searchPlaceholder: {
    fontSize: rf(15),
    color: Colors.textTertiary,
  },
  filterButton: {
    width: Math.max(rs(48), MIN_TOUCH),
    height: Math.max(rs(48), MIN_TOUCH),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: rs(20),
    marginBottom: rs(14),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  seeAll: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  recommendedRow: {
    paddingHorizontal: rs(20),
    gap: RECOMMENDED_CARD_GAP,
    paddingBottom: rs(8),
  },
  recommendedPlaceholder: {
    width: RECOMMENDED_CARD_WIDTH,
    height: rs(140),
    justifyContent: "center",
    alignItems: "center",
    gap: rs(8),
  },
  recommendedPlaceholderText: {
    fontSize: rf(13),
    color: Colors.textSecondary,
  },
  recommendedCard: {
    width: RECOMMENDED_CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: rs(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: rs(12),
    elevation: 4,
  },
  recommendedImage: {
    width: "100%",
    height: rs(140),
    backgroundColor: Colors.surfaceElevated,
  },
  discountBadge: {
    position: "absolute",
    top: rs(12),
    left: rs(12),
    backgroundColor: Colors.primary + "30",
    paddingHorizontal: rs(8),
    paddingVertical: rs(4),
    borderRadius: rs(8),
  },
  discountText: {
    fontSize: rf(11),
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  heartButton: {
    position: "absolute",
    top: rs(12),
    right: rs(12),
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  heartCircle: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recommendedInfo: {
    padding: rs(12),
  },
  recommendedName: {
    fontSize: rf(15),
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: rs(6),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    marginBottom: rs(6),
  },
  ratingText: {
    fontSize: rf(13),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  locText: {
    fontSize: rf(12),
    color: Colors.textSecondary,
    flex: 1,
  },
  priceText: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: rf(13),
    fontWeight: "400" as const,
    color: Colors.textSecondary,
  },
  nearbyList: {
    paddingHorizontal: rs(20),
    paddingBottom: rs(20),
  },
  nearbyCard: {
    backgroundColor: Colors.card,
    borderRadius: rs(16),
    overflow: "hidden",
    marginBottom: rs(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: rs(12),
    elevation: 4,
  },
  nearbyImageWrap: {
    position: "relative",
    height: rs(180),
    backgroundColor: Colors.surfaceElevated,
  },
  nearbyImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.surfaceElevated,
  },
  nearbyInfo: {
    padding: rs(14),
  },
  nearbyName: {
    fontSize: rf(17),
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: rs(6),
  },
  emptyState: {
    paddingVertical: rs(48),
    alignItems: "center",
    gap: rs(12),
  },
  emptyTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  emptySub: {
    fontSize: rf(14),
    color: Colors.textSecondary,
  },
});
