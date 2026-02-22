import React, { useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { MapViewSafe } from "@/app/map";
import type { HotelListItem } from "@/lib/app-context";

export default function HotelLocationScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{
    hotelId: string;
    hotelName: string;
    latitude: string;
    longitude: string;
    address?: string;
  }>();
  const { userLocation: contextUserLocation, setUserLocation } = useApp();
  const [localUserLocation, setLocalUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(contextUserLocation);
  const [locationStatus, setLocationStatus] = useState<
    "pending" | "granted" | "denied"
  >(contextUserLocation ? "granted" : "pending");

  const hotelId = params.hotelId ?? "";
  const hotelName = params.hotelName ?? "Hotel";
  const lat = parseFloat(params.latitude ?? "0");
  const lng = parseFloat(params.longitude ?? "0");
  const address = params.address ?? "";

  const hotelAsListItem: HotelListItem = useMemo(
    () => ({
      id: hotelId,
      name: hotelName,
      location: address,
      city: "",
      country: "",
      description: "",
      pricePerNight: 0,
      originalPrice: 0,
      rating: 0,
      reviewCount: 0,
      images: [],
      amenities: [],
      latitude: lat,
      longitude: lng,
      category: "",
      featured: false,
    }),
    [hotelId, hotelName, address, lat, lng]
  );

  const hasCoords = lat !== 0 || lng !== 0;
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const headerHeight = rs(56);
  const bottomBarHeight = rs(84);
  const mapHeight = Math.max(200, height - topInset - headerHeight - bottomBarHeight - bottomInset);

  useEffect(() => {
    if (Platform.OS === "web" || contextUserLocation) return;
    (async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();
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
      } catch {
        setLocationStatus("denied");
      }
    })();
  }, [Platform.OS, contextUserLocation, setUserLocation]);

  const handleGetDirection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/hotel/directions",
      params: {
        hotelId,
        hotelName,
        latitude: params.latitude ?? "",
        longitude: params.longitude ?? "",
        address: address || undefined,
      },
    });
  };

  if (!hasCoords && Platform.OS !== "web") {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: topInset + rs(8) }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={rs(24)} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Hotel Location</Text>
          <View style={{ width: rs(40) }} />
        </View>
        <View style={styles.placeholder}>
          <Ionicons
            name="location-outline"
            size={rs(48)}
            color={Colors.textTertiary}
          />
          <Text style={styles.placeholderText}>Location not available</Text>
          <Text style={styles.placeholderSub}>{address || hotelName}</Text>
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: topInset + rs(8) }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={rs(24)} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Hotel Location</Text>
          <View style={{ width: rs(40) }} />
        </View>
        <View style={styles.webCard}>
          <Pressable style={styles.getDirBtn} onPress={handleGetDirection}>
            <Ionicons name="navigate" size={rs(20)} color="#fff" />
            <Text style={styles.getDirBtnText}>Get Direction</Text>
          </Pressable>
          <Text style={styles.webHint}>
            Open in app for map and turn-by-turn directions.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + rs(8) }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Hotel Location</Text>
        <View style={{ width: rs(40) }} />
      </View>

      <View style={[styles.mapWrap, { flex: 1 }]}>
        <MapViewSafe
          hotels={[hotelAsListItem]}
          userLocation={null}
          locationStatus={locationStatus}
          focusHotelId={hotelId}
          mapHeight={mapHeight}
          showUserLocation={false}
        />
      </View>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + rs(16) }]}>
        <Pressable
          style={({ pressed }) => [
            styles.getDirBtn,
            pressed && styles.getDirBtnPressed,
          ]}
          onPress={handleGetDirection}
        >
          <Ionicons name="navigate" size={rs(20)} color="#fff" />
          <Text style={styles.getDirBtnText}>Get Direction</Text>
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
    paddingHorizontal: rs(16),
    paddingBottom: rs(12),
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  mapWrap: {
    position: "relative",
  },
  bottomBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: rs(20),
    paddingTop: rs(16),
    borderTopLeftRadius: rs(20),
    borderTopRightRadius: rs(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  getDirBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    minHeight: Math.max(rs(52), MIN_TOUCH),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
  },
  getDirBtnPressed: {
    opacity: 0.9,
  },
  getDirBtnText: {
    fontSize: rf(16),
    fontWeight: "600" as const,
    color: "#fff",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: rs(24),
  },
  placeholderText: {
    fontSize: rf(16),
    color: Colors.textSecondary,
    marginTop: rs(12),
  },
  placeholderSub: {
    fontSize: rf(14),
    color: Colors.textTertiary,
    marginTop: rs(4),
  },
  webCard: {
    margin: rs(20),
    padding: rs(20),
    backgroundColor: Colors.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  webHint: {
    fontSize: rf(12),
    color: Colors.textTertiary,
    marginTop: rs(12),
  },
});
