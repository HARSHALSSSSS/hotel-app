import React from "react";
import { StyleSheet, View, Pressable, Text, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { Hotel } from "@/lib/hotel-data";
import { useApp } from "@/lib/app-context";
import { router } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

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
          <Image source={{ uri: hotel.images[0] }} style={styles.compactImage} contentFit="cover" transition={300} />
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>{hotel.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.compactLocation} numberOfLines={1}>{hotel.location}</Text>
            </View>
            <View style={styles.compactBottom}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color={Colors.star} />
                <Text style={styles.ratingText}>{hotel.rating}</Text>
              </View>
              <Text style={styles.compactPrice}>
                ${hotel.pricePerNight}<Text style={styles.perNight}>/night</Text>
              </Text>
            </View>
          </View>
          <Pressable style={styles.compactHeart} onPress={handleFavorite} hitSlop={8}>
            <Ionicons name={saved ? "heart" : "heart-outline"} size={18} color={saved ? Colors.error : Colors.textSecondary} />
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
      <Pressable style={styles.card} onPress={handlePress}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: hotel.images[0] }} style={styles.image} contentFit="cover" transition={300} />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
          <Pressable style={styles.heartButton} onPress={handleFavorite} hitSlop={8}>
            <View style={styles.heartBg}>
              <Ionicons name={saved ? "heart" : "heart-outline"} size={20} color={saved ? Colors.error : "#fff"} />
            </View>
          </Pressable>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={Colors.star} />
              <Text style={styles.rating}>{hotel.rating}</Text>
              <Text style={styles.reviewCount}>({hotel.reviewCount})</Text>
            </View>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.location}>{hotel.location}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${hotel.pricePerNight}</Text>
            <Text style={styles.perNight}>/night</Text>
            {hotel.originalPrice > hotel.pricePerNight && (
              <Text style={styles.originalPrice}>${hotel.originalPrice}</Text>
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
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  heartButton: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  heartBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: 16,
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  perNight: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  compactCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  compactImage: {
    width: 100,
    height: 100,
  },
  compactInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  compactName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    paddingRight: 28,
  },
  compactLocation: {
    fontSize: 12,
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
    gap: 3,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  compactPrice: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  compactHeart: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});
