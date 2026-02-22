import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Linking,
  BackHandler,
} from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { fetchDirections, type DirectionsResult } from "@/lib/directions";

const ARRIVAL_THRESHOLD_METERS = 50;

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
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

export default function HotelDirectionsScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{
    hotelId: string;
    hotelName: string;
    latitude: string;
    longitude: string;
    address?: string;
  }>();
  const { userLocation: contextUserLocation } = useApp();

  const hotelId = params.hotelId ?? "";
  const hotelName = params.hotelName ?? "Hotel";
  const destLat = parseFloat(params.latitude ?? "0");
  const destLng = parseFloat(params.longitude ?? "0");
  const address = params.address ?? "";

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(contextUserLocation);
  const [locationStatus, setLocationStatus] = useState<
    "pending" | "granted" | "denied"
  >(contextUserLocation ? "granted" : "pending");
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeError, setRouteError] = useState(false);
  const [distanceToDest, setDistanceToDest] = useState<number | null>(null);
  const [arrived, setArrived] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const goBackToLocation = () => {
    router.replace({
      pathname: "/hotel/location",
      params: { hotelId, hotelName, latitude: params.latitude ?? "", longitude: params.longitude ?? "", address: address || undefined },
    });
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      setLoading(false);
      return;
    }
    (async () => {
      if (contextUserLocation) {
        setUserLocation(contextUserLocation);
        setLocationStatus("granted");
      } else {
        try {
          const { status } =
            await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setLocationStatus("denied");
            setLoading(false);
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
          setUserLocation(loc);
        } catch {
          setLocationStatus("denied");
          setLoading(false);
          return;
        }
      }
    })();
  }, [contextUserLocation]);

  useEffect(() => {
    if (!userLocation || destLat === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setRouteError(false);
    fetchDirections(userLocation, { latitude: destLat, longitude: destLng })
      .then((result) => {
        setDirections(result);
        if (!result) setRouteError(true);
      })
      .catch(() => setRouteError(true))
      .finally(() => setLoading(false));
  }, [userLocation?.latitude, userLocation?.longitude, destLat, destLng]);

  const handleStartNavigation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasStarted(true);
    setIsNavigating(true);
  };

  useEffect(() => {
    if (
      Platform.OS === "web" ||
      locationStatus !== "granted" ||
      !userLocation ||
      !hasStarted
    )
      return;

    watchRef.current = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: isNavigating ? 2000 : 5000,
        distanceInterval: isNavigating ? 5 : 20,
      },
      (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(loc);
        const dist = haversineMeters(
          loc.latitude,
          loc.longitude,
          destLat,
          destLng
        );
        setDistanceToDest(dist);
        if (dist <= ARRIVAL_THRESHOLD_METERS && !arrived) {
          setArrived(true);
          setIsNavigating(false);
          if (watchRef.current) {
            watchRef.current.remove();
            watchRef.current = null;
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace({
            pathname: "/hotel/arrived",
            params: { hotelId, hotelName },
          });
        }
      }
    );
    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
    };
  }, [
    locationStatus,
    destLat,
    destLng,
    hotelId,
    hotelName,
    arrived,
    hasStarted,
    isNavigating,
  ]);

  useEffect(() => {
    if (userLocation && distanceToDest == null && destLat !== 0) {
      const d = haversineMeters(
        userLocation.latitude,
        userLocation.longitude,
        destLat,
        destLng
      );
      setDistanceToDest(d);
      if (d <= ARRIVAL_THRESHOLD_METERS && !arrived) {
        setArrived(true);
        router.replace({
          pathname: "/hotel/arrived",
          params: { hotelId, hotelName },
        });
      }
    }
  }, [
    userLocation,
    destLat,
    destLng,
    hotelId,
    hotelName,
    arrived,
    distanceToDest,
  ]);

  const handleOpenInMaps = () => {
    const dest = `${destLat},${destLng}`;
    const origin = userLocation
      ? `${userLocation.latitude},${userLocation.longitude}`
      : "";
    const url = origin
      ? `https://www.openstreetmap.org/directions?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(dest)}`
      : `https://www.openstreetmap.org/directions?to=${encodeURIComponent(dest)}`;
    Linking.openURL(url);
  };

  const handleYouHaveArrived = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({
      pathname: "/hotel/arrived",
      params: { hotelId, hotelName },
    });
  };

  const handleRecenter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!cameraRef.current) return;
    if (hasStarted && userLocation) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 17,
        animationDuration: 400,
      });
    } else {
      // Fit full route (zoom out) when not yet started
      const points = directions?.coordinates ?? [];
      const all = userLocation
        ? [
            [userLocation.longitude, userLocation.latitude],
            ...points.map((c) => [c.longitude, c.latitude] as [number, number]),
            [destLng, destLat],
          ]
        : [
            ...points.map((c) => [c.longitude, c.latitude] as [number, number]),
            [destLng, destLat],
          ];
      const unique = all.filter(
        (c, i) => all.findIndex((d) => d[0] === c[0] && d[1] === c[1]) === i
      );
      if (unique.length >= 2) {
        const lngs = unique.map((c) => c[0]);
        const lats = unique.map((c) => c[1]);
        let minLng = Math.min(...lngs);
        let maxLng = Math.max(...lngs);
        let minLat = Math.min(...lats);
        let maxLat = Math.max(...lats);
        const lngSpan = Math.max(maxLng - minLng, 0.001);
        const latSpan = Math.max(maxLat - minLat, 0.001);
        minLng -= lngSpan * 0.15;
        maxLng += lngSpan * 0.15;
        minLat -= latSpan * 0.15;
        maxLat += latSpan * 0.15;
        cameraRef.current.fitBounds(
          [maxLng, maxLat],
          [minLng, minLat],
          rs(80),
          280
        );
      } else if (userLocation) {
        cameraRef.current.setCamera({
          centerCoordinate: [userLocation.longitude, userLocation.latitude],
          zoomLevel: 14,
          animationDuration: 400,
        });
      }
    }
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: topInset + rs(8) }]}>
          <Pressable style={styles.backBtn} onPress={goBackToLocation}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Get Direction</Text>
          <View style={{ width: rs(40) }} />
        </View>
        <View style={styles.webCard}>
          <Text style={styles.webTitle}>{hotelName}</Text>
          {address ? (
            <Text style={styles.webAddress} numberOfLines={2}>
              {address}
            </Text>
          ) : null}
          <Pressable style={styles.openMapsBtn} onPress={handleOpenInMaps}>
            <Ionicons name="navigate" size={rs(20)} color="#fff" />
            <Text style={styles.openMapsBtnText}>Open in OpenStreetMap</Text>
          </Pressable>
          <Text style={styles.webHint}>
            Use the app for turn-by-turn directions and live position.
          </Text>
        </View>
      </View>
    );
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: topInset + rs(8) }]}>
          <Pressable style={styles.backBtn} onPress={goBackToLocation}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Get Direction</Text>
          <View style={{ width: rs(40) }} />
        </View>
        <View style={[styles.placeholder, { gap: rs(16) }]}>
          <Text style={styles.placeholderText}>
            Map requires a development build.
          </Text>
          <Pressable style={styles.openMapsBtn} onPress={handleOpenInMaps}>
            <Ionicons name="navigate" size={rs(20)} color="#fff" />
            <Text style={styles.openMapsBtnText}>Open in OpenStreetMap</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  let MapView: any;
  let Camera: any;
  let PointAnnotation: any;
  let ShapeSource: any;
  let LineLayer: any;
  let UserLocation: any;
  try {
    const maplibre = require("@maplibre/maplibre-react-native");
    MapView = maplibre.MapView;
    Camera = maplibre.Camera;
    PointAnnotation = maplibre.PointAnnotation;
    ShapeSource = maplibre.ShapeSource;
    LineLayer = maplibre.LineLayer;
    UserLocation = maplibre.UserLocation;
  } catch {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: topInset + rs(8) }]}>
          <Pressable style={styles.backBtn} onPress={goBackToLocation}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Get Direction</Text>
          <View style={{ width: rs(40) }} />
        </View>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Map is not available on this platform.
          </Text>
        </View>
      </View>
    );
  }

  const OSM_STYLE = {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "osm-tiles",
        type: "raster",
        source: "osm",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };

  const routeGeoJSON = React.useMemo(() => {
    const coords = directions?.coordinates ?? [];
    if (coords.length < 2) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: coords.map((c) => [c.longitude, c.latitude]),
      },
    };
  }, [directions?.coordinates]);

  const cameraRef = React.useRef<any>(null);

  const cameraConfig = React.useMemo(() => {
    const points = directions?.coordinates ?? [];
    const all = userLocation
      ? [
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          ...points,
          { latitude: destLat, longitude: destLng },
        ]
      : [...points, { latitude: destLat, longitude: destLng }];
    if (all.length === 0)
      return {
        centerCoordinate: [destLng || 0, destLat || 20] as [number, number],
        zoomLevel: 12,
      };
    const lats = all.map((p) => p.latitude);
    const lngs = all.map((p) => p.longitude);
    const center: [number, number] = [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
    return { centerCoordinate: center, zoomLevel: 11 };
  }, [directions?.coordinates, userLocation, destLat, destLng]);

  // Fit the entire route with padding (Google Maps style) – zoom out to show full route before user taps Start
  useEffect(() => {
    if (destLat === 0 || hasStarted || loading) return;
    const points = directions?.coordinates ?? [];
    const all = userLocation
      ? [
          [userLocation.longitude, userLocation.latitude],
          ...points.map((c) => [c.longitude, c.latitude] as [number, number]),
          [destLng, destLat],
        ]
      : [
          ...points.map((c) => [c.longitude, c.latitude] as [number, number]),
          [destLng, destLat],
        ];
    const unique = all.filter(
      (c, i) => all.findIndex((d) => d[0] === c[0] && d[1] === c[1]) === i
    );
    if (unique.length < 2) return;
    const lngs = unique.map((c) => c[0]);
    const lats = unique.map((c) => c[1]);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    // Expand bounds by 15% so route has breathing room (like Google Maps)
    const lngSpan = Math.max(maxLng - minLng, 0.001);
    const latSpan = Math.max(maxLat - minLat, 0.001);
    minLng -= lngSpan * 0.15;
    maxLng += lngSpan * 0.15;
    minLat -= latSpan * 0.15;
    maxLat += latSpan * 0.15;
    const ne: [number, number] = [maxLng, maxLat];
    const sw: [number, number] = [minLng, minLat];
    const padding = rs(80);
    const id = setTimeout(() => {
      if (cameraRef.current && !hasStarted && !loading) {
        cameraRef.current.fitBounds(ne, sw, padding, 280);
      }
    }, 50);
    return () => clearTimeout(id);
  }, [directions?.coordinates, userLocation, destLat, destLng, hasStarted, loading]);

  // When user taps Start: zoom in to current location (start of route) like Google Maps
  useEffect(() => {
    if (
      cameraRef.current &&
      userLocation &&
      hasStarted &&
      isNavigating &&
      !arrived &&
      distanceToDest != null &&
      distanceToDest > ARRIVAL_THRESHOLD_METERS
    ) {
      cameraRef.current.setCamera({
        centerCoordinate: [
          userLocation.longitude,
          userLocation.latitude,
        ] as [number, number],
        zoomLevel: 17,
        animationDuration: 500,
      });
    }
  }, [
    userLocation?.latitude,
    userLocation?.longitude,
    hasStarted,
    isNavigating,
    arrived,
    distanceToDest,
  ]);

  const distanceText =
    distanceToDest != null
      ? distanceToDest >= 1000
        ? `${(distanceToDest / 1000).toFixed(1)} km`
        : `${Math.round(distanceToDest)} m`
      : null;
  const isClose =
    distanceToDest != null && distanceToDest <= ARRIVAL_THRESHOLD_METERS;

  const performBack = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setHasStarted(false);
    setIsNavigating(false);
    goBackToLocation();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hasStarted) {
      Alert.alert(
        "Cancel navigation?",
        "Are you sure you want to stop and go back?",
        [
          { text: "No, stay", style: "cancel" },
          { text: "Yes, go back", onPress: performBack },
        ]
      );
    } else {
      performBack();
    }
  };

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [hasStarted, handleBack]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          styles.headerOverlay,
          { paddingTop: topInset + rs(8) },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          delayPressIn={0}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Get Direction</Text>
        <View style={{ width: Math.max(rs(40), MIN_TOUCH) }} />
      </View>

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Getting route...</Text>
          </View>
        ) : null}
        <MapView
          style={styles.map}
          mapStyle={OSM_STYLE}
          attributionEnabled
          compassEnabled
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: cameraConfig.centerCoordinate,
              zoomLevel: cameraConfig.zoomLevel,
            }}
          />
          {locationStatus === "granted" && (
            <UserLocation visible={true} />
          )}
          <PointAnnotation
            id="destination"
            coordinate={[destLng, destLat]}
            title={hotelName}
            snippet={address}
          >
            <View
              style={{
                width: rs(24),
                height: rs(24),
                borderRadius: rs(12),
                backgroundColor: Colors.primary,
                borderWidth: 2,
                borderColor: "#fff",
              }}
            />
          </PointAnnotation>
          {routeGeoJSON && (
            <ShapeSource id="route" shape={routeGeoJSON}>
              <LineLayer
                id="route-line"
                style={{
                  lineColor: "#1A1D21",
                  lineWidth: 5,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </ShapeSource>
          )}
        </MapView>

        <Pressable
          style={styles.recenterBtn}
          onPress={handleRecenter}
        >
          <Ionicons name="locate" size={rs(22)} color={Colors.primary} />
        </Pressable>
      </View>

      <View
        style={[styles.bottomCard, { paddingBottom: bottomInset + rs(16) }]}
      >
        {routeError ||
        (locationStatus === "denied" && !userLocation) ? (
          <Pressable style={styles.openMapsBtn} onPress={handleOpenInMaps}>
            <Ionicons name="open-outline" size={rs(20)} color="#fff" />
            <Text style={styles.openMapsBtnText}>
              Open in OpenStreetMap
            </Text>
          </Pressable>
        ) : (
          <>
            {distanceText != null && (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons
                    name="navigate"
                    size={rs(18)}
                    color={Colors.primary}
                  />
                  <Text style={styles.statText}>{distanceText}</Text>
                </View>
                {directions?.durationSeconds != null && (
                  <View style={styles.stat}>
                    <Ionicons
                      name="time-outline"
                      size={rs(18)}
                      color={Colors.primary}
                    />
                    <Text style={styles.statText}>
                      {Math.round(directions.durationSeconds / 60)} min
                    </Text>
                  </View>
                )}
              </View>
            )}
            {isClose ? (
              <Pressable
                style={({ pressed }) => [
                  styles.arrivedBtn,
                  pressed && styles.arrivedBtnPressed,
                ]}
                onPress={handleYouHaveArrived}
              >
                <Ionicons name="checkmark-circle" size={rs(22)} color="#fff" />
                <Text style={styles.arrivedBtnText}>You have arrived</Text>
              </Pressable>
            ) : !hasStarted ? (
              <Pressable
                style={({ pressed }) => [
                  styles.startBtn,
                  pressed && styles.startBtnPressed,
                ]}
                onPress={handleStartNavigation}
              >
                <Text style={styles.startBtnText}>Start</Text>
              </Pressable>
            ) : (
              <View style={styles.followHint}>
                <Ionicons
                  name="navigate-outline"
                  size={rs(16)}
                  color={Colors.textSecondary}
                />
                <Text style={styles.followHintText}>
                  Map follows you as you move
                </Text>
              </View>
            )}
          </>
        )}
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
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
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
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  map: {
    flex: 1,
    width: "100%",
  },
  loadingWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    zIndex: 5,
  },
  loadingText: {
    marginTop: rs(8),
    fontSize: rf(14),
    color: Colors.textSecondary,
  },
  recenterBtn: {
    position: "absolute",
    right: rs(16),
    bottom: rs(16),
    width: Math.max(rs(44), MIN_TOUCH),
    height: Math.max(rs(44), MIN_TOUCH),
    borderRadius: rs(22),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomCard: {
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
  statsRow: {
    flexDirection: "row",
    gap: rs(16),
    marginBottom: rs(12),
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
  },
  statText: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  startBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: rs(52),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
  },
  startBtnPressed: {
    opacity: 0.9,
  },
  startBtnText: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: "#fff",
  },
  arrivedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    height: rs(52),
    borderRadius: rs(14),
    backgroundColor: Colors.success,
  },
  arrivedBtnPressed: {
    opacity: 0.9,
  },
  arrivedBtnText: {
    fontSize: rf(16),
    fontWeight: "600" as const,
    color: "#fff",
  },
  followHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(6),
    paddingVertical: rs(12),
  },
  followHintText: {
    fontSize: rf(13),
    color: Colors.textSecondary,
  },
  openMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    height: rs(52),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
  },
  openMapsBtnText: {
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
  },
  webCard: {
    margin: rs(20),
    padding: rs(20),
    backgroundColor: Colors.surface,
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  webTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: rs(4),
  },
  webAddress: {
    fontSize: rf(14),
    color: Colors.textSecondary,
    marginBottom: rs(16),
  },
  webHint: {
    fontSize: rf(12),
    color: Colors.textTertiary,
    marginTop: rs(12),
  },
});
