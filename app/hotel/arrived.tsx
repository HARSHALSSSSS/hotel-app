import React from "react";
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
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";

export default function HotelArrivedScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    hotelId: string;
    hotelName: string;
  }>();

  const hotelId = params.hotelId ?? "";
  const hotelName = params.hotelName ?? "Hotel";

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const iconSize = Math.min(width * 0.28, rs(120));

  const handleOK = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({ pathname: "/hotel/[id]", params: { id: hotelId } });
  };

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
          <Ionicons name="chevron-back" size={rs(24)} color={Colors.text} />
        </Pressable>
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: rs(40),
            paddingBottom: bottomInset + rs(24),
          },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={iconSize * 0.5}
            color="#fff"
          />
        </View>
        <Text style={styles.title}>You Have Arrived!</Text>
        <Text style={styles.subtitle}>
          You have arrived at the Hotel location
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.okBtn,
            pressed && styles.okBtnPressed,
          ]}
          onPress={handleOK}
        >
          <Text style={styles.okBtnText}>OK</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(16),
    paddingBottom: rs(12),
    backgroundColor: "#fff",
  },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: rs(32),
  },
  iconCircle: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(24),
  },
  title: {
    fontSize: rf(24),
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: rs(8),
  },
  subtitle: {
    fontSize: rf(15),
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: rs(40),
  },
  okBtn: {
    width: "100%",
    minHeight: Math.max(rs(52), MIN_TOUCH),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  okBtnPressed: {
    opacity: 0.9,
  },
  okBtnText: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: "#fff",
  },
});
