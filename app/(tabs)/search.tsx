import React, { useState, useMemo } from "react";
import { StyleSheet, View, Text, FlatList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import { HOTELS } from "@/lib/hotel-data";
import SearchBar from "@/components/SearchBar";
import CategoryPills from "@/components/CategoryPills";
import HotelCard from "@/components/HotelCard";
import FilterModal, { FilterState, DEFAULT_FILTERS } from "@/components/FilterModal";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q || "");
  const [category, setCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const { searchHotels } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const results = useMemo(() => {
    let hotels = searchHotels(query, category, filters.minPrice, filters.maxPrice, filters.minRating);
    switch (filters.sortBy) {
      case "price_low":
        hotels = [...hotels].sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "price_high":
        hotels = [...hotels].sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case "rating":
        hotels = [...hotels].sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
        hotels = [...hotels].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }
    return hotels;
  }, [query, category, filters, searchHotels]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onFilterPress={() => setShowFilters(true)}
          autoFocus={!params.q}
        />
        <View style={styles.categoryRow}>
          <CategoryPills selected={category} onSelect={setCategory} />
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {results.length} {results.length === 1 ? "hotel" : "hotels"} found
        </Text>
      </View>

      {results.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No hotels found</Text>
          <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <HotelCard hotel={item} index={index} variant="compact" />
          )}
          ListFooterComponent={<View style={{ height: Platform.OS === "web" ? 34 : 100 }} />}
        />
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
        initialFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryRow: {
    marginHorizontal: -20,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  list: {
    paddingHorizontal: 20,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
