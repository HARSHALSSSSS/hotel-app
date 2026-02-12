import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import { Room, Review } from "@/lib/hotel-data";
import ImageGallery from "@/components/ImageGallery";

const { width } = Dimensions.get("window");

function AmenityChip({ name }: { name: string }) {
  const iconMap: Record<string, string> = {
    "Pool": "water-outline",
    "Spa": "leaf-outline",
    "Restaurant": "restaurant-outline",
    "Gym": "barbell-outline",
    "Beach Access": "umbrella-outline",
    "Room Service": "bed-outline",
    "Concierge": "people-outline",
    "Valet Parking": "car-outline",
    "Business Center": "briefcase-outline",
    "Bar": "wine-outline",
    "Laundry": "shirt-outline",
    "Wi-Fi": "wifi-outline",
    "Private Beach": "umbrella-outline",
    "Diving Center": "fish-outline",
    "Water Sports": "boat-outline",
    "Overwater Bungalow": "home-outline",
    "Sunset Cruise": "boat-outline",
    "Infinity Pool": "water-outline",
    "Helipad": "airplane-outline",
    "Butler Service": "person-outline",
    "Shopping Arcade": "bag-outline",
    "Rooftop Terrace": "sunny-outline",
    "Wine Cellar": "wine-outline",
    "Rooftop Bar": "wine-outline",
    "Ski Access": "snow-outline",
    "Fireplace": "flame-outline",
    "Heated Pool": "water-outline",
    "Mountain Guide": "trail-sign-outline",
    "Kids Club": "happy-outline",
    "Yoga Studio": "body-outline",
    "Cenote Access": "water-outline",
    "Eco Tours": "leaf-outline",
    "Yacht Charter": "boat-outline",
  };

  return (
    <View style={styles.amenityChip}>
      <Ionicons name={(iconMap[name] || "ellipse-outline") as any} size={16} color={Colors.primary} />
      <Text style={styles.amenityText}>{name}</Text>
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={[styles.reviewAvatar, { backgroundColor: review.avatar }]}>
          <Text style={styles.reviewAvatarText}>{review.userName.charAt(0)}</Text>
        </View>
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewName}>{review.userName}</Text>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <View style={styles.reviewRating}>
          <Ionicons name="star" size={12} color={Colors.star} />
          <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );
}

function RoomCard({ room, onSelect }: { room: Room; onSelect: () => void }) {
  return (
    <View style={styles.roomCard}>
      <Image source={{ uri: room.image }} style={styles.roomImage} contentFit="cover" transition={300} />
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.roomDesc} numberOfLines={2}>{room.description}</Text>
        <View style={styles.roomMeta}>
          <View style={styles.roomMetaItem}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.roomMetaText}>{room.maxGuests} guests</Text>
          </View>
          <View style={styles.roomMetaItem}>
            <Ionicons name="bed-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.roomMetaText}>{room.bedType}</Text>
          </View>
          <View style={styles.roomMetaItem}>
            <Ionicons name="resize-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.roomMetaText}>{room.size}m²</Text>
          </View>
        </View>
        <View style={styles.roomBottom}>
          <Text style={styles.roomPrice}>
            ${room.pricePerNight}<Text style={styles.roomPriceUnit}>/night</Text>
          </Text>
          <Pressable
            style={[styles.selectBtn, !room.available && styles.selectBtnDisabled]}
            onPress={room.available ? onSelect : undefined}
          >
            <Text style={[styles.selectBtnText, !room.available && styles.selectBtnTextDisabled]}>
              {room.available ? "Select" : "Sold Out"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getHotelById, isFavorite, toggleFavorite } = useApp();
  const [showAllReviews, setShowAllReviews] = useState(false);

  const hotel = getHotelById(id);
  if (!hotel) return null;

  const saved = isFavorite(hotel.id);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(hotel.id);
  };

  const handleSelectRoom = (room: Room) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/booking",
      params: {
        hotelId: hotel.id,
        roomId: room.id,
        roomName: room.name,
        roomPrice: room.pricePerNight.toString(),
        hotelName: hotel.name,
        hotelImage: hotel.images[0],
      },
    });
  };

  const visibleReviews = showAllReviews ? hotel.reviews : hotel.reviews.slice(0, 3);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.galleryContainer}>
          <ImageGallery images={hotel.images} height={320} />
          <View style={[styles.galleryOverlay, { top: topInset + 8 }]}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </Pressable>
            <View style={styles.galleryActions}>
              <Pressable style={styles.actionBtn} onPress={handleFavorite}>
                <Ionicons name={saved ? "heart" : "heart-outline"} size={20} color={saved ? Colors.error : Colors.text} />
              </Pressable>
              <Pressable style={styles.actionBtn}>
                <Ionicons name="share-outline" size={20} color={Colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.content}>
          <View style={styles.titleSection}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{hotel.category.charAt(0).toUpperCase() + hotel.category.slice(1)}</Text>
            </View>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <Text style={styles.locationText}>{hotel.location}</Text>
            </View>
            <View style={styles.ratingRow}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Ionicons
                    key={i}
                    name={i <= Math.floor(hotel.rating) ? "star" : i - 0.5 <= hotel.rating ? "star-half" : "star-outline"}
                    size={16}
                    color={Colors.star}
                  />
                ))}
              </View>
              <Text style={styles.ratingValue}>{hotel.rating}</Text>
              <Text style={styles.reviewCountText}>({hotel.reviewCount} reviews)</Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            <View>
              <View style={styles.priceRow}>
                <Text style={styles.currentPrice}>${hotel.pricePerNight}</Text>
                <Text style={styles.priceNight}>/night</Text>
              </View>
              {hotel.originalPrice > hotel.pricePerNight && (
                <Text style={styles.originalPriceText}>${hotel.originalPrice}</Text>
              )}
            </View>
            {hotel.originalPrice > hotel.pricePerNight && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>
                  Save ${hotel.originalPrice - hotel.pricePerNight}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{hotel.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {hotel.amenities.map((amenity) => (
                <AmenityChip key={amenity} name={amenity} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Rooms</Text>
            {hotel.rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={() => handleSelectRoom(room)}
              />
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.reviewSectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Pressable onPress={() => setShowAllReviews(!showAllReviews)}>
                <Text style={styles.seeAllBtn}>
                  {showAllReviews ? "Show less" : `See all (${hotel.reviews.length})`}
                </Text>
              </Pressable>
            </View>
            {visibleReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </View>

          <View style={{ height: 100 + bottomInset }} />
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 8 }]}>
        <View>
          <View style={styles.bottomPriceRow}>
            <Text style={styles.bottomPrice}>${hotel.pricePerNight}</Text>
            <Text style={styles.bottomPriceUnit}>/night</Text>
          </View>
          {hotel.originalPrice > hotel.pricePerNight && (
            <Text style={styles.bottomOriginal}>${hotel.originalPrice}</Text>
          )}
        </View>
        <Pressable
          style={styles.bookNowBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const availableRoom = hotel.rooms.find((r) => r.available);
            if (availableRoom) handleSelectRoom(availableRoom);
          }}
        >
          <Text style={styles.bookNowText}>Book Now</Text>
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
  galleryContainer: {
    position: "relative",
  },
  galleryOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
  },
  titleSection: {
    paddingTop: 20,
    gap: 6,
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: Colors.accent + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.accentDark,
  },
  hotelName: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  reviewCountText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.primary + "08",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "15",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  priceNight: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  originalPriceText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
  },
  saveBadge: {
    backgroundColor: Colors.success + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  saveText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.success,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  amenityText: {
    fontSize: 13,
    color: Colors.text,
  },
  roomCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  roomImage: {
    width: "100%",
    height: 150,
  },
  roomInfo: {
    padding: 14,
    gap: 6,
  },
  roomName: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  roomDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  roomMeta: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  roomMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roomMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  roomBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  roomPrice: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  roomPriceUnit: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: Colors.textSecondary,
  },
  selectBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  selectBtnDisabled: {
    backgroundColor: Colors.border,
  },
  selectBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
  selectBtnTextDisabled: {
    color: Colors.textTertiary,
  },
  reviewSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllBtn: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewRatingText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  bottomPriceUnit: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bottomOriginal: {
    fontSize: 13,
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
  },
  bookNowBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bookNowText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
});
