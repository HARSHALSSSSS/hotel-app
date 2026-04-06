import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { HotelImage } from "@/components/HotelImage";
import * as Location from "expo-location";
import Colors from "@/constants/colors";
import { rs, rf, SCREEN_WIDTH, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import type { HotelListItem } from "@/lib/app-context";
import { MapViewSafe } from "@/app/map";
import { getOptimizedImageUrl } from "@/lib/image-utils";

const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_MARGIN = rs(16);
const CARD_IMAGE_HEIGHT = rs(180);
const MAP_HEIGHT_RATIO = 0.36;
const TAB_BAR_HEIGHT = rs(88);

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ q?: string }>();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const {
    fetchNearbyHotels,
    exploreLocation,
    setExploreLocation,
    setLocationDisplayName,
    setExploreQuery,
    exploreQuery,
    searchFilters,
    userLocation,
    setUserLocation,
    isFavorite,
    toggleFavorite,
    searchHotels,
  } = useApp();

  const [query, setQuery] = useState(params.q || exploreQuery || "");
  const [nearbyHotels, setNearbyHotels] = useState<HotelListItem[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [localUserLocation, setLocalUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(userLocation ?? null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">(
    userLocation ? "granted" : "pending"
  );

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const effectiveUserLocation = userLocation ?? localUserLocation;
  const mapHeight = height * MAP_HEIGHT_RATIO;

  useEffect(() => {
    if (exploreQuery) setQuery(exploreQuery);
  }, [exploreQuery]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      if (userLocation) {
        setLocationStatus("granted");
        setLocalUserLocation(userLocation);
        return;
      }
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "denied") {
          setLocationStatus("denied");
          return;
        }
        setLocationStatus("granted");
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLocalUserLocation(loc);
        setUserLocation(loc);
        if (!exploreLocation) {
          setExploreLocation({ lat: loc.latitude, lng: loc.longitude });
          try {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: loc.latitude,
              longitude: loc.longitude,
            });
            const parts: string[] = [];
            if (address?.city) parts.push(address.city);
            if (address?.region && address.region !== address?.city)
              parts.push(address.region);
            if (address?.country) parts.push(address.country);
            const displayName =
              parts.length > 0
                ? parts.join(", ")
                : `${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°`;
            setLocationDisplayName(displayName);
            setExploreQuery(displayName);
          } catch {
            setExploreQuery(
              `${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°`
            );
          }
        }
      } catch {
        setLocationStatus("denied");
      }
    })();
  }, [
    Platform.OS,
    userLocation,
    setUserLocation,
    setExploreLocation,
    setLocationDisplayName,
    setExploreQuery,
    exploreLocation,
  ]);

  useEffect(() => {
    if (!exploreLocation) return;
    setNearbyLoading(true);
    fetchNearbyHotels(exploreLocation.lat, exploreLocation.lng, 80)
      .then(setNearbyHotels)
      .catch(() => setNearbyHotels([]))
      .finally(() => setNearbyLoading(false));
  }, [exploreLocation?.lat, exploreLocation?.lng, fetchNearbyHotels]);

  const searchResults = useMemo(() => {
    let hotels = searchHotels(
      query,
      "all",
      searchFilters.minPrice || 0,
      searchFilters.maxPrice || 100000,
      searchFilters.minRating || 0
    );
    switch (searchFilters.sortBy) {
      case "price_low":
        hotels = [...hotels].sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "price_high":
        hotels = [...hotels].sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case "rating":
        hotels = [...hotels].sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
      default:
        hotels = [...hotels].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }
    return hotels;
  }, [query, searchFilters, searchHotels]);

  const results = useMemo(() => {
    if (exploreLocation) {
      const q = query.trim().toLowerCase();
      const isLocationDisplayQuery = q && exploreQuery.toLowerCase() === q;
      if (q && !isLocationDisplayQuery) {
        return nearbyHotels.filter(
          (h) =>
            h.name.toLowerCase().includes(q) ||
            (h.location && h.location.toLowerCase().includes(q)) ||
            (h.city && h.city.toLowerCase().includes(q))
        );
      }
      return nearbyHotels;
    }
    return searchResults;
  }, [exploreLocation, nearbyHotels, query, exploreQuery, searchResults]);

  type HotelWithDistance = HotelListItem & { distanceKm: number | null };
  const resultsWithDistance = useMemo((): HotelWithDistance[] => {
    if (!exploreLocation)
      return results.map((h) => ({ ...h, distanceKm: null }));
    return results.map((h) => ({
      ...h,
      distanceKm:
        h.latitude != null && h.longitude != null
          ? haversineKm(
              exploreLocation.lat,
              exploreLocation.lng,
              h.latitude,
              h.longitude
            )
          : null,
    }));
  }, [results, exploreLocation]);

  useEffect(() => {
    const urls = resultsWithDistance
      .slice(0, 12)
      .map((h) => getOptimizedImageUrl(h.images?.[0], "card"))
      .filter(Boolean) as string[];
    if (urls.length > 0) Image.prefetch(urls, "memory-disk").catch(() => {});
  }, [resultsWithDistance]);

  const handleSearchBarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/enter-location");
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + rs(12) }]}>
        <Pressable
          style={styles.searchRow}
          onPress={handleSearchBarPress}
          android_ripple={{ color: "rgba(0,0,0,0.05)" }}
        >
          <Ionicons
            name="search"
            size={rs(20)}
            color={Colors.textSecondary}
          />
          <Text
            style={styles.searchPlaceholder}
            numberOfLines={1}
          >
            {exploreQuery || "City, area, or hotel name"}
          </Text>
          <Ionicons
            name="locate-outline"
            size={rs(20)}
            color={Colors.primary}
          />
        </Pressable>
        <Pressable
          style={styles.filterBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/filter");
          }}
        >
          <Ionicons name="options-outline" size={rs(20)} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.mapSection, { height: mapHeight }]}>
          {mounted && Platform.OS !== "web" ? (
            <View style={styles.realMapWrap}>
              <MapViewSafe
                hotels={resultsWithDistance}
                userLocation={effectiveUserLocation}
                locationStatus={locationStatus}
                mapHeight={mapHeight}
              />
              <Pressable
                style={[styles.recenterBtn, { bottom: rs(50) }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/map");
                }}
              >
                <Ionicons name="locate" size={rs(24)} color={Colors.primary} />
              </Pressable>
              <Pressable
                style={styles.viewMapBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/map");
                }}
              >
                <Ionicons name="map" size={rs(18)} color={Colors.primary} />
                <Text style={styles.viewMapText}>View on map</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.mapPlaceholder}>
                <Ionicons
                  name="map-outline"
                  size={rs(48)}
                  color={Colors.textTertiary}
                />
                <Text style={styles.mapPlaceholderText}>Map</Text>
                <Pressable
                  style={[styles.recenterBtn, { bottom: rs(50) }]}
                  onPress={() => router.push("/map")}
                >
                  <Ionicons name="locate" size={rs(24)} color={Colors.primary} />
                </Pressable>
              </View>
              <Pressable
                style={styles.viewMapBtn}
                onPress={() => router.push("/map")}
              >
                <Ionicons name="map" size={rs(18)} color={Colors.primary} />
                <Text style={styles.viewMapText}>View on map</Text>
              </Pressable>
            </>
          )}
      </View>

      {nearbyLoading && exploreLocation ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding hotels near you...</Text>
        </View>
      ) : resultsWithDistance.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.empty}
        >
            <Ionicons
              name="search-outline"
              size={rs(48)}
              color={Colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>No hotels found</Text>
            <Text style={styles.emptyText}>
              Search by city, area, or hotel name
            </Text>
            <Pressable
              style={styles.enterLocationBtn}
              onPress={() => router.push("/enter-location")}
            >
              <Ionicons name="locate" size={rs(18)} color="#fff" />
              <Text style={styles.enterLocationBtnText}>Enter location</Text>
            </Pressable>
        </Animated.View>
      ) : (
        <View style={[styles.listSection, { paddingBottom: bottomInset + TAB_BAR_HEIGHT }]}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Nearby Hotels</Text>
            <Text style={styles.listCount}>
              {resultsWithDistance.length} hotels
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.horizontalList]}
          >
            {resultsWithDistance.map((item, index) => (
              <Pressable
                key={item.id}
                style={[styles.hotelCard, { width: CARD_WIDTH, marginRight: CARD_MARGIN }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/hotel/[id]",
                    params: { id: item.id },
                  });
                }}
              >
                <View style={[styles.cardImageWrap, { height: CARD_IMAGE_HEIGHT }]}>
                  <HotelImage
                    uri={item.images?.[0]}
                    size="card"
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={150}
                    cachePolicy="memory-disk"
                    priority="normal"
                    recyclingKey={`search-${item.id}`}
                  />
                  <Pressable
                    style={styles.heartBtn}
                    onPress={async (e) => {
                      e.stopPropagation();
                      await toggleFavorite(item.id);
                    }}
                  >
                    <Ionicons
                      name={
                        isFavorite(item.id) ? "heart" : "heart-outline"
                      }
                      size={rs(20)}
                      color={
                        isFavorite(item.id) ? Colors.error : "#fff"
                      }
                    />
                  </Pressable>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardNamePriceRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardPrice}>
                      ₹{item.pricePerNight.toLocaleString("en-IN")}
                      <Text style={styles.cardPriceSuffix}>/night</Text>
                    </Text>
                  </View>
                  <View style={styles.cardLocationRow}>
                    <Ionicons
                      name="location-outline"
                      size={rs(14)}
                      color={Colors.textSecondary}
                    />
                    <Text
                      style={styles.cardLocation}
                      numberOfLines={1}
                    >
                      {item.location}, {item.city}
                    </Text>
                  </View>
                  <View style={styles.cardRatingRow}>
                    <Ionicons name="star" size={rs(14)} color={Colors.star} />
                    <Text style={styles.cardRating}>
                      {item.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.cardReviews}>
                      ({item.reviewCount} Reviews)
                    </Text>
                  </View>
                  {item.distanceKm != null && (
                    <View style={styles.distanceRow}>
                      <Ionicons
                        name="walk-outline"
                        size={rs(14)}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.distanceText}>
                        {item.distanceKm.toFixed(1)} km
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(16),
    paddingBottom: rs(12),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: rs(10),
  },
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    paddingVertical: Platform.OS === "ios" ? rs(10) : rs(8),
    gap: rs(10),
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: rf(15),
    color: Colors.textSecondary,
    paddingVertical: rs(8),
  },
  filterBtn: {
    width: Math.max(rs(46), MIN_TOUCH),
    height: Math.max(rs(46), MIN_TOUCH),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  mapSection: {
    position: "relative",
    backgroundColor: "transparent",
  },
  realMapWrap: {
    flex: 1,
    position: "relative",
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.borderLight,
  },
  mapPlaceholderText: {
    fontSize: rf(14),
    color: Colors.textTertiary,
    marginTop: rs(8),
  },
  recenterBtn: {
    position: "absolute",
    right: rs(16),
    width: Math.max(rs(48), MIN_TOUCH),
    height: Math.max(rs(48), MIN_TOUCH),
    borderRadius: rs(24),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  viewMapBtn: {
    position: "absolute",
    right: rs(16),
    top: rs(12),
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    backgroundColor: "#fff",
    borderRadius: rs(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  viewMapText: {
    fontSize: rf(13),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: rs(12),
  },
  loadingText: { fontSize: rf(14), color: Colors.textSecondary },
  empty: {
    minHeight: rs(200),
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    paddingVertical: rs(48),
  },
  emptyTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  emptyText: { fontSize: rf(14), color: Colors.textSecondary },
  enterLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    marginTop: rs(20),
    paddingVertical: rs(12),
    paddingHorizontal: rs(20),
    backgroundColor: Colors.primary,
    borderRadius: rs(12),
  },
  enterLocationBtnText: {
    fontSize: rf(15),
    fontWeight: "600" as const,
    color: "#fff",
  },
  listSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    marginTop: -rs(24),
    paddingTop: rs(20),
    paddingBottom: rs(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rs(20),
    marginBottom: rs(8),
  },
  listTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  listCount: {
    fontSize: rf(13),
    color: Colors.textSecondary,
  },
  horizontalList: {
    paddingHorizontal: rs(20),
    paddingVertical: rs(4),
    alignItems: "stretch",
  },
  hotelCard: {
    backgroundColor: "#fff",
    borderRadius: rs(16),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImageWrap: {
    position: "relative",
  },
  cardImage: { width: "100%", height: "100%" },
  heartBtn: {
    position: "absolute",
    top: rs(10),
    right: rs(10),
    width: Math.max(rs(36), MIN_TOUCH - 4),
    height: Math.max(rs(36), MIN_TOUCH - 4),
    borderRadius: rs(18),
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: rs(12),
    gap: rs(6),
  },
  cardNamePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardName: {
    flex: 1,
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: Colors.text,
    marginRight: rs(8),
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
  },
  cardLocation: {
    flex: 1,
    fontSize: rf(13),
    color: Colors.textSecondary,
  },
  cardRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
  },
  cardRating: {
    fontSize: rf(13),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  cardReviews: {
    fontSize: rf(12),
    color: Colors.textSecondary,
  },
  cardPrice: {
    fontSize: rf(15),
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  cardPriceSuffix: {
    fontSize: rf(12),
    fontWeight: "500" as const,
    color: Colors.text,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    marginTop: rs(2),
  },
  distanceText: { fontSize: rf(12), color: Colors.textSecondary },
});
