import React from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH, SCREEN_WIDTH } from "@/constants/responsive";
import { Hotel } from "@/lib/hotel-data";
import { useApp } from "@/lib/app-context";
import { router } from "expo-router";
import { getOptimizedImageUrl } from "@/lib/image-utils";

const CARD_WIDTH = SCREEN_WIDTH - rs(40);

interface HotelCardProps {
  hotel: Hotel;
  index?: number;
  variant?: "large" | "compact";
}

export default function HotelCard({ hotel, index = 0, variant = "large" }: HotelCardProps) {
  const { isFavorite, toggleFavorite } = useApp();
  const saved = isFavorite(hotel.id);

  const handleFavorite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleFavorite(hotel.id);
  };

  const handlePress = () => {
    router.push({ pathname: "/hotel/[id]", params: { id: hotel.id } });
  };

  const discount = Math.round(((hotel.originalPrice - hotel.pricePerNight) / hotel.originalPrice) * 100);

  if (variant === "compact") {
    return (
      <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
        <Pressable style={styles.compactCard} onPress={handlePress}>
          <Image
            source={{ uri: getOptimizedImageUrl(hotel.images[0], "card") }}
            style={styles.compactImage}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            priority={index < 4 ? "high" : "normal"}
            recyclingKey={`card-${hotel.id}`}
          />
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>{hotel.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={rs(12)} color={Colors.textSecondary} />
              <Text style={styles.compactLocation} numberOfLines={1}>{hotel.location}</Text>
            </View>
            <View style={styles.compactBottom}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={rs(11)} color={Colors.star} />
                <Text style={styles.ratingText}>{hotel.rating}</Text>
              </View>
                <Text style={styles.compactPrice}>
                ₹{hotel.pricePerNight.toLocaleString("en-IN")}<Text style={styles.perNight}>/night</Text>
              </Text>
            </View>
          </View>
          <Pressable style={styles.compactHeart} onPress={handleFavorite} hitSlop={8}>
            <Ionicons name={saved ? "heart" : "heart-outline"} size={rs(18)} color={saved ? Colors.error : Colors.textSecondary} />
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
      <Pressable style={styles.card} onPress={handlePress}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getOptimizedImageUrl(hotel.images[0], "card") }}
            style={styles.image}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            priority={index < 3 ? "high" : "normal"}
            recyclingKey={`card-${hotel.id}`}
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
          <Pressable style={styles.heartButton} onPress={handleFavorite} hitSlop={8}>
            <View style={styles.heartBg}>
              <Ionicons name={saved ? "heart" : "heart-outline"} size={rs(20)} color={saved ? Colors.error : "#fff"} />
            </View>
          </Pressable>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={rs(14)} color={Colors.star} />
              <Text style={styles.rating}>{hotel.rating}</Text>
              <Text style={styles.reviewCount}>({hotel.reviewCount})</Text>
            </View>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={rs(14)} color={Colors.textSecondary} />
            <Text style={styles.location}>{hotel.location}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{hotel.pricePerNight.toLocaleString("en-IN")}</Text>
            <Text style={styles.perNight}>/night</Text>
            {hotel.originalPrice > hotel.pricePerNight && (
              <Text style={styles.originalPrice}>₹{hotel.originalPrice.toLocaleString("en-IN")}</Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: rs(20),
    overflow: "hidden",
    marginBottom: rs(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: rs(4) },
    shadowOpacity: 0.08,
    shadowRadius: rs(12),
    elevation: 4,
  },
  imageContainer: {
    width: "100%",
    height: rs(200),
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: rs(12),
    left: rs(12),
    backgroundColor: Colors.accent,
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(8),
  },
  discountText: {
    color: "#fff",
    fontSize: rf(11),
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  heartButton: {
    position: "absolute",
    top: rs(12),
    right: rs(12),
  },
  heartBg: {
    width: Math.max(rs(36), MIN_TOUCH),
    height: Math.max(rs(36), MIN_TOUCH),
    borderRadius: rs(18),
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: rs(16),
    gap: rs(6),
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: rf(17),
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
    marginRight: rs(8),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(3),
  },
  rating: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  reviewCount: {
    fontSize: rf(12),
    color: Colors.textSecondary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
  },
  location: {
    fontSize: rf(13),
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: rs(2),
    marginTop: rs(4),
  },
  price: {
    fontSize: rf(20),
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  perNight: {
    fontSize: rf(13),
    color: Colors.textSecondary,
  },
  originalPrice: {
    fontSize: rf(14),
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
    marginLeft: rs(6),
  },
  compactCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: rs(16),
    overflow: "hidden",
    marginBottom: rs(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: rs(2) },
    shadowOpacity: 0.06,
    shadowRadius: rs(8),
    elevation: 2,
    position: "relative",
  },
  compactImage: {
    width: rs(100),
    height: rs(100),
  },
  compactInfo: {
    flex: 1,
    padding: rs(12),
    justifyContent: "space-between",
  },
  compactName: {
    fontSize: rf(15),
    fontWeight: "700" as const,
    color: Colors.text,
    paddingRight: rs(28),
  },
  compactLocation: {
    fontSize: rf(12),
    color: Colors.textSecondary,
    flex: 1,
  },
  compactBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(3),
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(6),
  },
  ratingText: {
    fontSize: rf(12),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  compactPrice: {
    fontSize: rf(15),
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  compactHeart: {
    position: "absolute",
    top: rs(10),
    right: rs(10),
  },
});
