import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { HOTELS, POPULAR_DESTINATIONS } from "@/lib/hotel-data";
import { useApp } from "@/lib/app-context";
import HotelCard from "@/components/HotelCard";
import SearchBar from "@/components/SearchBar";
import CategoryPills from "@/components/CategoryPills";
import DestinationCard from "@/components/DestinationCard";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useApp();
  const [category, setCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const featuredHotels = HOTELS.filter((h) => h.featured);
  const filteredHotels =
    category === "all"
      ? HOTELS.slice(0, 6)
      : HOTELS.filter((h) => h.category === category);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello there</Text>
              <Text style={styles.headline}>Find your perfect stay</Text>
            </View>
            <Pressable
              style={styles.notifButton}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.text} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Pressable onPress={() => router.push("/(tabs)/search")}>
              <View pointerEvents="none">
                <SearchBar value="" onChangeText={() => {}} placeholder="Search hotels, destinations..." />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <Pressable onPress={() => router.push("/(tabs)/search")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destinationsRow}
          >
            {POPULAR_DESTINATIONS.map((dest) => (
              <DestinationCard
                key={dest.id}
                name={dest.name}
                country={dest.country}
                image={dest.image}
                hotelCount={dest.hotelCount}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/search",
                    params: { q: dest.name },
                  })
                }
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Hotels</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
            decelerationRate="fast"
            snapToInterval={280 + 14}
          >
            {featuredHotels.map((hotel, idx) => (
              <FeaturedCard key={hotel.id} hotel={hotel} index={idx} />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
          </View>
          <CategoryPills selected={category} onSelect={setCategory} />
        </Animated.View>

        <View style={styles.hotelList}>
          {filteredHotels.map((hotel, idx) => (
            <View key={hotel.id} style={styles.hotelCardWrapper}>
              <HotelCard hotel={hotel} index={idx} />
            </View>
          ))}
        </View>

        <View style={{ height: Platform.OS === "web" ? 34 : 100 }} />
      </ScrollView>
    </View>
  );
}

function FeaturedCard({ hotel, index }: { hotel: any; index: number }) {
  const { isFavorite, toggleFavorite } = useApp();
  const saved = isFavorite(hotel.id);

  return (
    <Pressable
      style={styles.featuredCard}
      onPress={() => router.push({ pathname: "/hotel/[id]", params: { id: hotel.id } })}
    >
      <Image source={{ uri: hotel.images[0] }} style={styles.featuredImage} contentFit="cover" transition={300} />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={styles.featuredGradient} />
      <Pressable
        style={styles.featuredHeart}
        onPress={() => toggleFavorite(hotel.id)}
        hitSlop={8}
      >
        <View style={styles.heartCircle}>
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={16}
            color={saved ? Colors.error : "#fff"}
          />
        </View>
      </Pressable>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName} numberOfLines={1}>
          {hotel.name}
        </Text>
        <View style={styles.featuredMeta}>
          <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.featuredLocation} numberOfLines={1}>
            {hotel.location}
          </Text>
        </View>
        <View style={styles.featuredBottom}>
          <View style={styles.featuredRating}>
            <Ionicons name="star" size={12} color={Colors.star} />
            <Text style={styles.featuredRatingText}>{hotel.rating}</Text>
          </View>
          <Text style={styles.featuredPrice}>
            ${hotel.pricePerNight}
            <Text style={styles.featuredPriceUnit}>/night</Text>
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  headline: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#fff",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  destinationsRow: {
    paddingHorizontal: 20,
  },
  featuredRow: {
    paddingHorizontal: 20,
    gap: 14,
  },
  featuredCard: {
    width: 280,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  featuredHeart: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  heartCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredInfo: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },
  featuredName: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  featuredLocation: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  featuredBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredRatingText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#fff",
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
  },
  featuredPriceUnit: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  hotelList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  hotelCardWrapper: {
    width: "100%",
    alignItems: "center",
  },
});
