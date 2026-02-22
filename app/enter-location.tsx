import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";

const RECENT_SEARCHES_KEY = "@stayease_recent_searches";
const MAX_RECENT = 5;

// Popular destinations in India (city name -> approximate center coords)
const POPULAR_CITIES: { name: string; subtext: string; lat: number; lng: number }[] = [
  { name: "Mumbai", subtext: "Maharashtra, India", lat: 19.076, lng: 72.8777 },
  { name: "New Delhi", subtext: "India", lat: 28.6139, lng: 77.209 },
  { name: "Bangalore", subtext: "Karnataka, India", lat: 12.9716, lng: 77.5946 },
  { name: "Goa", subtext: "India", lat: 15.2993, lng: 74.124 },
  { name: "Chennai", subtext: "Tamil Nadu, India", lat: 13.0827, lng: 80.2707 },
  { name: "Hyderabad", subtext: "Telangana, India", lat: 17.385, lng: 78.4867 },
  { name: "Kolkata", subtext: "West Bengal, India", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", subtext: "Maharashtra, India", lat: 18.5204, lng: 73.8567 },
  { name: "Jaipur", subtext: "Rajasthan, India", lat: 26.9124, lng: 75.7873 },
  { name: "Udaipur", subtext: "Rajasthan, India", lat: 24.5755, lng: 73.6788 },
  { name: "Kochi", subtext: "Kerala, India", lat: 9.9312, lng: 76.2673 },
  { name: "Ahmedabad", subtext: "Gujarat, India", lat: 23.0225, lng: 72.5714 },
];

export type LocationResult = {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  type: "hotel" | "city";
};

export default function EnterLocationScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    setExploreLocation,
    setExploreQuery,
    setLocationDisplayName,
    setUserLocation,
    setHasSeenLocationPrompt,
    searchHotels,
  } = useApp();

  const [query, setQuery] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [recentSearches, setRecentSearches] = useState<LocationResult[]>([]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((raw) => {
      try {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, MAX_RECENT));
        }
      } catch {}
    });
  }, []);

  const saveRecentSearch = (item: LocationResult) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((p) => p.id !== item.id && p.title.toLowerCase() !== item.title.toLowerCase());
      const next = [item, ...filtered].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Search: hotels by name, city, location/area + city suggestions
  const searchResults = useMemo((): LocationResult[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: LocationResult[] = [];

    // 1. Hotels matching name, city, or location
    const fromHotels = searchHotels(query, "all")
      .slice(0, 8)
      .map((h) => ({
        id: h.id,
        title: h.name,
        address: `${h.location}, ${h.city}, ${h.country}`,
        lat: h.latitude ?? 0,
        lng: h.longitude ?? 0,
        type: "hotel" as const,
      }));
    results.push(...fromHotels);

    // 2. City matches (if query matches city name and no hotel with that exact city was already added)
    const cityMatches = POPULAR_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subtext.toLowerCase().includes(q)
    ).slice(0, 5);
    for (const c of cityMatches) {
      if (!results.some((r) => r.type === "city" && r.title === c.name)) {
        results.push({
          id: `city-${c.name}`,
          title: c.name,
          address: c.subtext,
          lat: c.lat,
          lng: c.lng,
          type: "city",
        });
      }
    }

    return results;
  }, [query, searchHotels]);

  const showRecommended = !query.trim();
  const recommendedCities = useMemo(
    () => POPULAR_CITIES.slice(0, 8),
    []
  );

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location required", "Enable location access to find hotels near you.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setExploreLocation({ lat, lng });
      setUserLocation({ latitude: lat, longitude: lng });

      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const parts: string[] = [];
        if (address?.city) parts.push(address.city);
        if (address?.region && address.region !== address?.city) parts.push(address.region);
        if (address?.country) parts.push(address.country);
        const displayName = parts.length > 0 ? parts.join(", ") : `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        setLocationDisplayName(displayName);
        setExploreQuery(displayName);
      } catch {
        const displayName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        setLocationDisplayName(displayName);
        setExploreQuery(displayName);
      }
      setHasSeenLocationPrompt(true);
      router.replace("/(tabs)/search");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not get your location.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSelectResult = (item: LocationResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExploreLocation({ lat: item.lat, lng: item.lng });
    setExploreQuery(item.title);
    setHasSeenLocationPrompt(true);
    saveRecentSearch(item);
    router.replace("/(tabs)/search");
  };

  const handleSelectRecommendedCity = (c: (typeof POPULAR_CITIES)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item: LocationResult = {
      id: `city-${c.name}`,
      title: c.name,
      address: c.subtext,
      lat: c.lat,
      lng: c.lng,
      type: "city",
    };
    setExploreLocation({ lat: c.lat, lng: c.lng });
    setExploreQuery(c.name);
    setHasSeenLocationPrompt(true);
    saveRecentSearch(item);
    router.replace("/(tabs)/search");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={topInset}
    >
      <View style={[styles.header, { paddingTop: topInset + rs(12) }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={rs(24)} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Enter Your Location</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: rs(24) + bottomInset }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={rs(20)} color={Colors.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="City, area, or hotel name"
            placeholderTextColor={Colors.textTertiary}
            returnKeyType="search"
            autoCapitalize="words"
          />
          {query.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={rs(22)} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <Pressable
          style={styles.useLocationRow}
          onPress={handleUseCurrentLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="locate" size={rs(22)} color={Colors.primary} />
          )}
          <Text style={styles.useLocationText}>Use my current location</Text>
        </Pressable>

        {showRecommended ? (
          <>
            {recentSearches.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>RECENT SEARCHES</Text>
                {recentSearches.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.resultRow}
                    onPress={() => handleSelectResult(r)}
                  >
                    <Ionicons name="time-outline" size={rs(20)} color={Colors.textSecondary} style={styles.resultIcon} />
                    <View style={styles.resultTextWrap}>
                      <Text style={styles.resultTitle}>{r.title}</Text>
                      <Text style={styles.resultAddress} numberOfLines={1}>
                        {r.address}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                <View style={styles.sectionDivider} />
              </>
            )}
            <Text style={styles.sectionLabel}>POPULAR DESTINATIONS</Text>
            <View style={styles.recommendedGrid}>
              {recommendedCities.map((c) => (
                <Pressable
                  key={c.name}
                  style={styles.recommendedChip}
                  onPress={() => handleSelectRecommendedCity(c)}
                >
                  <Ionicons name="location-outline" size={rs(18)} color={Colors.primary} />
                  <Text style={styles.recommendedText}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>SEARCH RESULT</Text>
            {searchResults.length === 0 ? (
              <Text style={styles.noResults}>No results for "{query}"</Text>
            ) : (
              searchResults.map((r) => (
                <Pressable
                  key={r.id}
                  style={styles.resultRow}
                  onPress={() => handleSelectResult(r)}
                >
                  <Ionicons
                    name="location-outline"
                    size={rs(20)}
                    color={Colors.primary}
                    style={styles.resultIcon}
                  />
                  <View style={styles.resultTextWrap}>
                    <Text style={styles.resultTitle}>{r.title}</Text>
                    <Text style={styles.resultAddress} numberOfLines={1}>
                      {r.address}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(16),
    paddingBottom: rs(16),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center" as const,
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  headerSpacer: { width: rs(40) },
  scroll: { flex: 1 },
  scrollContent: { padding: rs(20), paddingTop: rs(24) },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: rs(12),
    paddingHorizontal: rs(14),
    minHeight: rs(52),
    marginBottom: rs(16),
  },
  searchIcon: { marginRight: rs(12) },
  searchInput: { flex: 1, fontSize: rf(16), color: Colors.text, paddingVertical: rs(14) },
  clearBtn: { padding: rs(8), minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, justifyContent: "center", alignItems: "center" },
  useLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(12),
    paddingVertical: rs(14),
    paddingHorizontal: rs(4),
    marginBottom: rs(24),
    minHeight: MIN_TOUCH,
  },
  useLocationText: { fontSize: rf(16), fontWeight: "600" as const, color: Colors.text },
  sectionLabel: {
    fontSize: rf(12),
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: rs(12),
  },
  sectionDivider: { height: rs(16) },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  resultIcon: { marginRight: rs(12) },
  resultTextWrap: { flex: 1 },
  resultTitle: { fontSize: rf(16), fontWeight: "600" as const, color: Colors.text },
  resultAddress: { fontSize: rf(13), color: Colors.textSecondary, marginTop: rs(2) },
  noResults: {
    fontSize: rf(15),
    color: Colors.textSecondary,
    paddingVertical: rs(20),
  },
  recommendedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(10),
  },
  recommendedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    borderRadius: rs(12),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  recommendedText: { fontSize: rf(14), fontWeight: "600" as const, color: Colors.text },
});
