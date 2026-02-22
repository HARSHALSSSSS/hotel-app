import React, { useMemo, useEffect, useRef, useState, Component } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  Linking,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import type { HotelListItem } from "@/lib/app-context";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";

// Default center: India (all hotels are in India)
const DEFAULT_REGION = {
  latitude: 21.0,
  longitude: 78.0,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

// MapLibre style: OpenStreetMap via Carto Voyager tiles (no API key, no Google)
const OSM_MAP_STYLE: object = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }],
};

function MapViewMapLibre({
  hotels,
  userLocation,
  locationStatus,
  focusHotelId,
  mapHeight,
  showUserLocation = true,
}: {
  hotels: HotelListItem[];
  userLocation: { latitude: number; longitude: number } | null;
  locationStatus: "pending" | "granted" | "denied";
  focusHotelId?: string | null;
  mapHeight?: number;
  showUserLocation?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const effectiveHeight = mapHeight ?? height - insets.top - 60;

  let MapView: any;
  let Camera: any;
  let PointAnnotation: any;
  let ShapeSource: any;
  let CircleLayer: any;
  let UserLocation: any;
  try {
    const maplibre = require("@maplibre/maplibre-react-native");
    MapView = maplibre.MapView;
    Camera = maplibre.Camera;
    PointAnnotation = maplibre.PointAnnotation;
    ShapeSource = maplibre.ShapeSource;
    CircleLayer = maplibre.CircleLayer;
    UserLocation = maplibre.UserLocation;
  } catch {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: rs(20) }}>
        <Text style={{ fontSize: rf(16), color: Colors.textSecondary }}>Map is not available on this platform.</Text>
      </View>
    );
  }

  const hotelsWithCoords = useMemo(
    () => hotels.filter((h) => h.latitude != null && h.longitude != null && (h.latitude !== 0 || h.longitude !== 0)),
    [hotels]
  );

  const focusHotel = useMemo(
    () => (focusHotelId ? hotelsWithCoords.find((h) => h.id === focusHotelId) : null),
    [focusHotelId, hotelsWithCoords]
  );

  const cameraConfig = useMemo(() => {
    if (focusHotel) {
      const points = userLocation ? [userLocation, { latitude: focusHotel.latitude, longitude: focusHotel.longitude }] : [{ latitude: focusHotel.latitude, longitude: focusHotel.longitude }];
      const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
      const lng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
      return { centerCoordinate: [lng, lat] as [number, number], zoomLevel: 13 };
    }
    const points = userLocation ? [userLocation, ...hotelsWithCoords.map((h) => ({ latitude: h.latitude, longitude: h.longitude }))] : hotelsWithCoords.map((h) => ({ latitude: h.latitude, longitude: h.longitude }));
    if (points.length === 0) return { centerCoordinate: [78, 21] as [number, number], zoomLevel: 5 };
    const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
    const zoom = Math.max(2, Math.min(12, 14 - Math.log2(Math.max(1, points.length))));
    return { centerCoordinate: [lng, lat] as [number, number], zoomLevel: zoom };
  }, [hotelsWithCoords, userLocation, focusHotel]);

  const circleGeoJSON = useMemo(() => {
    if (!userLocation || locationStatus !== "granted" || !showUserLocation) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "Point" as const,
        coordinates: [userLocation.longitude, userLocation.latitude],
      },
    };
  }, [userLocation, locationStatus, showUserLocation]);

  useEffect(() => {
    if (!cameraRef.current) return;
    const coords = userLocation
      ? [[userLocation.longitude, userLocation.latitude], ...hotelsWithCoords.map((h) => [h.longitude, h.latitude] as [number, number])]
      : hotelsWithCoords.map((h) => [h.longitude, h.latitude] as [number, number]);
    if (focusHotel) coords.push([focusHotel.longitude, focusHotel.latitude] as [number, number]);
    const unique = coords.filter((c, i) => coords.findIndex((d) => d[0] === (c as number[])[0] && d[1] === (c as number[])[1]) === i);
    if (unique.length === 0) return;
    if (unique.length === 1) {
      const [lng, lat] = unique[0] as number[];
      cameraRef.current.setCamera({ centerCoordinate: [lng, lat], zoomLevel: 14, animationDuration: 300 });
      return;
    }
    const lngs = unique.map((c) => (c as number[])[0]);
    const lats = unique.map((c) => (c as number[])[1]);
    const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];
    const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
    cameraRef.current.fitBounds(ne, sw, 80, 400);
  }, [userLocation, hotelsWithCoords, focusHotel]);

  return (
    <View style={[styles.mapContainer, mapHeight != null ? { height: mapHeight } : undefined]}>
      {locationStatus === "granted" && !mapHeight && (
        <View style={styles.locationBadge}>
          <View style={styles.locationBadgeDot} />
          <Text style={styles.locationBadgeText}>Your location enabled</Text>
        </View>
      )}
      {locationStatus === "denied" && !mapHeight && (
        <Pressable style={styles.locationDeniedBadge} onPress={() => Linking.openSettings()}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.locationDeniedText}>Enable location to see your position</Text>
          <Text style={styles.locationDeniedLink}>Open settings</Text>
        </Pressable>
      )}
      <MapView style={[styles.map, { width, height: effectiveHeight }]} mapStyle={OSM_MAP_STYLE} attributionEnabled={true} compassEnabled={true}>
        <Camera ref={cameraRef} defaultSettings={{ centerCoordinate: cameraConfig.centerCoordinate, zoomLevel: cameraConfig.zoomLevel }} />
        {locationStatus === "granted" && showUserLocation && <UserLocation visible={true} />}
        {circleGeoJSON && ShapeSource && CircleLayer && (
          <ShapeSource id="search-circle" shape={circleGeoJSON}>
            <CircleLayer id="circle-fill" style={{ circleRadius: 80, circleColor: Colors.primary + "15", circleStrokeWidth: 1, circleStrokeColor: Colors.primary + "40" }} />
          </ShapeSource>
        )}
        {hotelsWithCoords.map((hotel) => (
          <PointAnnotation
            key={hotel.id}
            id={hotel.id}
            coordinate={[hotel.longitude, hotel.latitude]}
            title={hotel.name}
            snippet={hotel.location}
            onSelected={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: "/hotel/[id]", params: { id: hotel.id } });
            }}
          >
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, borderWidth: 2, borderColor: "#fff" }} />
          </PointAnnotation>
        ))}
      </MapView>
    </View>
  );
}

/** Placeholder when native map is unavailable (Expo Go, etc.) */
function MapPlaceholderNative({
  hotels,
  mapHeight,
  focusHotelId,
}: {
  hotels: HotelListItem[];
  mapHeight?: number;
  focusHotelId?: string | null;
}) {
  const withCoords = hotels.filter((h) => h.latitude != null && h.longitude != null && (h.latitude !== 0 || h.longitude !== 0));
  const insets = useSafeAreaInsets();

  if (mapHeight) {
    return (
      <View style={[styles.mapPlaceholderCompact, { height: mapHeight }]}>
        <Ionicons name="map-outline" size={rs(48)} color={Colors.textTertiary} />
        <Text style={styles.mapPlaceholderText}>Map preview</Text>
        <Text style={styles.mapPlaceholderHint}>Tap "View on map" for full experience</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.fallbackScroll} contentContainerStyle={[styles.fallbackContent, { paddingTop: insets.top + 60 }]}>
      <Text style={styles.fallbackTitle}>Hotels on map</Text>
      <Text style={styles.fallbackSubtitle}>Map requires a development build. Open in OpenStreetMap:</Text>
      {withCoords.length === 0 ? (
        <Text style={styles.fallbackEmpty}>No hotel locations available.</Text>
      ) : (
        withCoords.map((hotel) => (
          <Pressable
            key={hotel.id}
            style={styles.fallbackItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL(`https://www.openstreetmap.org/?mlat=${hotel.latitude}&mlon=${hotel.longitude}#map=15/${hotel.latitude}/${hotel.longitude}`);
            }}
          >
            <Ionicons name="location" size={20} color={Colors.primary} />
            <View style={styles.fallbackItemText}>
              <Text style={styles.fallbackItemName}>{hotel.name}</Text>
              <Text style={styles.fallbackItemLocation}>{hotel.location}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={Colors.textSecondary} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

class MapErrorBoundary extends Component<
  {
    fallback: React.ReactNode;
    children: React.ReactNode;
  },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError = () => ({ hasError: true });
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/** MapLibre works on native dev builds. Expo Go lacks it. No API key needed. */
function canUseNativeMaps(): boolean {
  if (Platform.OS === "web") return false;
  const env = Constants.executionEnvironment;
  if (env === ExecutionEnvironment.StoreClient) return false;
  return true;
}

export function MapViewNative(props: Parameters<typeof MapViewMapLibre>[0]) {
  return <MapViewMapLibre {...props} />;
}

/** Safe wrapper - placeholder in Expo Go, MapLibre in dev builds */
export function MapViewSafe(props: {
  hotels: HotelListItem[];
  userLocation: { latitude: number; longitude: number } | null;
  locationStatus: "pending" | "granted" | "denied";
  focusHotelId?: string | null;
  mapHeight?: number;
  showUserLocation?: boolean;
}) {
  const placeholder = (
    <MapPlaceholderNative hotels={props.hotels} mapHeight={props.mapHeight} focusHotelId={props.focusHotelId} />
  );
  if (!canUseNativeMaps()) {
    return placeholder;
  }
  return (
    <MapErrorBoundary fallback={placeholder}>
      <MapViewMapLibre {...props} />
    </MapErrorBoundary>
  );
}

declare global {
  interface Window {
    L?: typeof import("leaflet").default;
  }
}

function OpenStreetMapWeb({ hotels, focusHotelId }: { hotels: HotelListItem[]; focusHotelId?: string | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<{ setView: (c: [number, number], z: number) => void } | null>(null);
  const markersRef = useRef<{ remove: () => void }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withCoords = useMemo(
    () => hotels.filter((h) => h.latitude != null && h.longitude != null && (h.latitude !== 0 || h.longitude !== 0)),
    [hotels]
  );
  const focusHotel = useMemo(() => (focusHotelId ? withCoords.find((h) => h.id === focusHotelId) : null), [focusHotelId, withCoords]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    function initMap() {
      const el = containerRef.current;
      const container = (el && typeof (el as any).getNativeNode === "function" ? (el as any).getNativeNode() : el) as HTMLElement | null;
      if (!container || !(window as any).L) return;
      const L = (window as any).L;
      const center = focusHotel
        ? [focusHotel.latitude, focusHotel.longitude] as [number, number]
        : withCoords.length
          ? ([withCoords.reduce((s, h) => s + h.latitude, 0) / withCoords.length, withCoords.reduce((s, h) => s + h.longitude, 0) / withCoords.length] as [number, number])
          : [21, 78] as [number, number];
      const zoom = focusHotel ? 14 : withCoords.length ? 10 : 5;
      const map = L.map(container).setView(center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      withCoords.forEach((hotel) => {
        const marker = L.marker([hotel.latitude, hotel.longitude])
          .addTo(map)
          .bindPopup(hotel.name);
        marker.on("click", () => router.push({ pathname: "/hotel/[id]", params: { id: hotel.id } }));
        markersRef.current.push(marker);
      });
      setLoaded(true);
    }

    if ((window as any).L) {
      setTimeout(initMap, 100);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.async = true;
    script.onload = () => setTimeout(initMap, 100);
    script.onerror = () => setError("Failed to load map.");
    document.head.appendChild(script);
  }, [withCoords.length, focusHotel?.id]);

  useEffect(() => {
    if (!mapRef.current || !(window as any).L) return;
    const L = (window as any).L;
    const center: [number, number] = focusHotel
      ? [focusHotel.latitude, focusHotel.longitude]
      : withCoords.length > 0
        ? [withCoords.reduce((s, h) => s + h.latitude, 0) / withCoords.length, withCoords.reduce((s, h) => s + h.longitude, 0) / withCoords.length]
        : [21, 78];
    mapRef.current.setView(center, focusHotel ? 14 : withCoords.length ? 10 : 5);
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    withCoords.forEach((hotel) => {
      const marker = L.marker([hotel.latitude, hotel.longitude])
        .addTo(mapRef.current!)
        .bindPopup(hotel.name);
      marker.on("click", () => router.push({ pathname: "/hotel/[id]", params: { id: hotel.id } }));
      markersRef.current.push(marker);
    });
  }, [withCoords, focusHotel]);

  if (error) {
    return (
      <View style={styles.webMapPlaceholder}>
        <Text style={styles.webMapError}>{error}</Text>
        <Text style={styles.webMapHint}>OpenStreetMap requires an internet connection.</Text>
      </View>
    );
  }

  return (
    <View style={styles.webMapWrapper}>
      {!loaded && (
        <View style={styles.webMapLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.webMapLoadingText}>Loading map...</Text>
        </View>
      )}
      <View style={[styles.webMapDiv, { opacity: loaded ? 1 : 0 }]} ref={containerRef as any} collapsable={false} />
    </View>
  );
}

function MapFallbackWeb({ hotels, focusHotelId }: { hotels: HotelListItem[]; focusHotelId?: string | null }) {
  return (
    <View style={{ flex: 1 }}>
      <OpenStreetMapWeb hotels={hotels} focusHotelId={focusHotelId} />
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ hotelId?: string }>();
  const { hotels, userLocation: globalUserLocation, setUserLocation } = useApp();
  const isWeb = Platform.OS === "web";
  const [localUserLocation, setLocalUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const focusHotelId = params.hotelId ?? null;
  const userLocation = globalUserLocation ?? localUserLocation;

  useEffect(() => {
    if (isWeb) return;
    if (globalUserLocation) {
      setLocationStatus("granted");
      return;
    }
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "denied") {
          setLocationStatus("denied");
          return;
        }
        setLocationStatus("granted");
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocalUserLocation(loc);
        setUserLocation(loc);
      } catch {
        setLocationStatus("denied");
      }
    })();
  }, [isWeb, globalUserLocation, setUserLocation]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Map</Text>
        <View style={{ width: 40 }} />
      </View>
      {isWeb ? <MapFallbackWeb hotels={hotels} focusHotelId={focusHotelId} /> : <MapViewSafe hotels={hotels} userLocation={userLocation} locationStatus={locationStatus} focusHotelId={focusHotelId} />}
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
    borderBottomWidth: 1,
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
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  locationBadge: {
    position: "absolute",
    top: rs(12),
    left: rs(12),
    right: rs(12),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    borderRadius: rs(10),
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: rs(3),
    elevation: 3,
  },
  locationBadgeDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: "#34C759",
    marginRight: rs(8),
  },
  locationBadgeText: {
    fontSize: rf(13),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  locationDeniedBadge: {
    position: "absolute",
    top: rs(12),
    left: rs(12),
    right: rs(12),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    borderRadius: rs(10),
    zIndex: 10,
    gap: rs(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: rs(3),
    elevation: 3,
  },
  locationDeniedText: {
    fontSize: rf(13),
    color: Colors.textSecondary,
    flex: 1,
  },
  locationDeniedLink: {
    fontSize: rf(13),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  mapPlaceholderCompact: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.borderLight,
    position: "relative",
  },
  mapPlaceholderText: {
    fontSize: rf(14),
    color: Colors.textTertiary,
    marginTop: rs(8),
  },
  mapPlaceholderHint: {
    fontSize: rf(12),
    color: Colors.textTertiary,
    marginTop: rs(8),
  },
  fallbackScroll: {
    flex: 1,
  },
  fallbackContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  fallbackEmpty: {
    fontSize: 15,
    color: Colors.textTertiary,
  },
  fallbackItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  fallbackItemText: {
    flex: 1,
    marginLeft: 12,
  },
  fallbackItemName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  fallbackItemLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  webMapWrapper: {
    flex: 1,
    minHeight: 400,
    position: "relative",
  },
  webMapDiv: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  webMapLoading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  webMapLoadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  webMapError: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
  },
  webMapHint: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 8,
    textAlign: "center",
  },
});
