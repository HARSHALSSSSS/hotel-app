import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";

export default function LocationPromptScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { userLocation, setUserLocation, setHasSeenLocationPrompt, setExploreLocation, setLocationDisplayName, setExploreQuery } = useApp();
  const [allowing, setAllowing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (userLocation) {
        setHasSeenLocationPrompt(true);
        router.replace("/(tabs)");
      }
    }, [userLocation, setHasSeenLocationPrompt])
  );

  const handleAllowLocation = async () => {
    setAllowing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location access",
          "We need location access to suggest nearby hotels. You can enter a location manually instead."
        );
        setAllowing(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const loc = { latitude: lat, longitude: lng };
      setUserLocation(loc);
      setExploreLocation({ lat, lng });

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
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not get your location.");
    } finally {
      setAllowing(false);
    }
  };

  const handleEnterManually = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/enter-location");
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const iconSize = Math.min(width * 0.35, rs(160));

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: topInset + rs(40), paddingBottom: bottomInset + rs(24) }]}>
        <View style={[styles.iconCircle, { width: iconSize, height: iconSize, borderRadius: iconSize / 2 }]}>
          <Ionicons name="location" size={iconSize * 0.5} color={Colors.primary} />
        </View>
        <Text style={styles.title}>What is Your Location?</Text>
        <Text style={styles.subtitle}>
          We need to know your location in order to suggest nearby services.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.allowBtn, pressed && styles.allowBtnPressed]}
          onPress={handleAllowLocation}
          disabled={allowing}
        >
          {allowing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.allowBtnText}>Allow Location Access</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.manualLink, pressed && styles.manualLinkPressed]}
          onPress={handleEnterManually}
          disabled={allowing}
        >
          <Text style={styles.manualLinkText}>Enter Location Manually</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: rs(32),
  },
  iconCircle: {
    backgroundColor: "rgba(27, 75, 102, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(28),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: rf(24),
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: rs(12),
  },
  subtitle: {
    fontSize: rf(15),
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: rf(22),
    marginBottom: rs(32),
    paddingHorizontal: rs(8),
  },
  allowBtn: {
    width: "100%",
    minHeight: Math.max(rs(52), MIN_TOUCH),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(16),
  },
  allowBtnPressed: {
    opacity: 0.9,
  },
  allowBtnText: {
    fontSize: rf(16),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  manualLink: {
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  manualLinkPressed: {
    opacity: 0.7,
  },
  manualLinkText: {
    fontSize: rf(16),
    fontWeight: "500",
    color: Colors.primary,
  },
});
