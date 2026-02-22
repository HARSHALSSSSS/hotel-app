import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import type { FilterState } from "@/components/FilterModal";

const SORT_OPTIONS: { label: string; value: FilterState["sortBy"] }[] = [
  { label: "All", value: "popular" },
  { label: "Popular", value: "popular" },
  { label: "Near by", value: "rating" },
  { label: "Price -", value: "price_low" },
];

const PRICE_MARKS = [10, 30, 50, 75, 100, 150].map((k) => k * 1000); // ₹10K–₹150K

const REVIEW_OPTIONS: { label: string; value: number }[] = [
  { label: "4.5 and above", value: 4.5 },
  { label: "4.0 - 4.5", value: 4.0 },
  { label: "3.5 - 4.0", value: 3.5 },
  { label: "3.0 - 3.5", value: 3.0 },
  { label: "2.5 - 3.0", value: 2.5 },
];

const FACILITIES = ["All", "Car Parking", "GYM", "Restaurant"];
const BEDROOMS = ["1", "1+", "2+", "3+", "4+", "5"];

export const DEFAULT_FILTERS_PAGE: FilterState & { facility: string; bedroom: string } = {
  minPrice: 10000,
  maxPrice: 100000,
  minRating: 4.5,
  sortBy: "popular",
  facility: "All",
  bedroom: "1",
};

export default function FilterScreen() {
  const insets = useSafeAreaInsets();
  const { searchFilters, setSearchFilters } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [sortBy, setSortBy] = useState<FilterState["sortBy"]>(
    (searchFilters.sortBy as FilterState["sortBy"]) || "popular"
  );
  const [minPrice, setMinPrice] = useState(searchFilters.minPrice || 25000);
  const [maxPrice, setMaxPrice] = useState(searchFilters.maxPrice || 100000);
  const [minRating, setMinRating] = useState(searchFilters.minRating ?? 4.5);
  const [facility, setFacility] = useState(searchFilters.facility || "All");
  const [bedroom, setBedroom] = useState(searchFilters.bedroom || "1");

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy("popular");
    setMinPrice(25000);
    setMaxPrice(100000);
    setMinRating(4.5);
    setFacility("All");
    setBedroom("1");
    setSearchFilters({
      sortBy: "popular",
      minPrice: 25000,
      maxPrice: 100000,
      minRating: 4.5,
      facility: "All",
      bedroom: "1",
    });
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSearchFilters({
      sortBy: String(sortBy),
      minPrice,
      maxPrice,
      minRating,
      facility,
      bedroom,
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + rs(12) }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={rs(24)} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Filter</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: rs(100) + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Sort by</Text>
        <View style={styles.chipRow}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.label}
              style={[styles.chip, sortBy === opt.value && styles.chipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSortBy(opt.value);
              }}
            >
              <Text style={[styles.chipText, sortBy === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: rs(24) }]}>Price Range</Text>
        <View style={styles.priceRow}>
          {PRICE_MARKS.map((p) => (
            <Text key={p} style={styles.priceMark}>₹{(p / 1000).toFixed(0)}K</Text>
          ))}
        </View>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, minPrice === 25000 && styles.chipActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMinPrice(25000); }}
          >
            <Text style={[styles.chipText, minPrice === 25000 && styles.chipTextActive]}>Min ₹25K</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, maxPrice === 100000 && styles.chipActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMaxPrice(100000); }}
          >
            <Text style={[styles.chipText, maxPrice === 100000 && styles.chipTextActive]}>Max ₹1L</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: rs(24) }]}>Reviews</Text>
        {REVIEW_OPTIONS.map((r) => (
          <Pressable
            key={r.value}
            style={styles.radioRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMinRating(r.value);
            }}
          >
            <View style={styles.starRow}>
              <Ionicons name="star" size={rs(18)} color={Colors.star} />
              <Text style={styles.radioLabel}>{r.label}</Text>
            </View>
            <View style={[styles.radioOuter, minRating === r.value && styles.radioOuterActive]}>
              {minRating === r.value && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: rs(24) }]}>Facilities</Text>
        <View style={styles.chipRow}>
          {FACILITIES.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, facility === f && styles.chipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFacility(f);
              }}
            >
              <Text style={[styles.chipText, facility === f && styles.chipTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: rs(24) }]}>Bedroom</Text>
        <View style={styles.chipRow}>
          {BEDROOMS.map((b) => (
            <Pressable
              key={b}
              style={[styles.chip, bedroom === b && styles.chipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setBedroom(b);
              }}
            >
              <Text style={[styles.chipText, bedroom === b && styles.chipTextActive]}>{b}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: rs(16) + bottomInset }]}>
        <Pressable style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>Reset Filter</Text>
        </Pressable>
        <Pressable style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(16),
    paddingBottom: rs(16),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center" as const,
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  headerSpacer: { width: rs(40) },
  scroll: { flex: 1 },
  scrollContent: { padding: rs(20), paddingTop: rs(24) },
  sectionTitle: { fontSize: rf(14), fontWeight: "700" as const, color: Colors.text, marginBottom: rs(12) },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: rs(10), marginBottom: rs(8) },
  chip: {
    paddingHorizontal: rs(18),
    paddingVertical: rs(12),
    borderRadius: rs(20),
    backgroundColor: "#F0F0F0",
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: rf(14), fontWeight: "600" as const, color: Colors.text },
  chipTextActive: { color: "#fff" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: rs(12), paddingHorizontal: rs(4) },
  priceMark: { fontSize: rf(12), color: Colors.textSecondary },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: rs(14),
    minHeight: MIN_TOUCH,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  starRow: { flexDirection: "row", alignItems: "center", gap: rs(8) },
  radioLabel: { fontSize: rf(15), color: Colors.text },
  radioOuter: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: Colors.primary },
  radioInner: { width: rs(12), height: rs(12), borderRadius: rs(6), backgroundColor: Colors.primary },
  footer: {
    flexDirection: "row",
    gap: rs(12),
    paddingHorizontal: rs(20),
    paddingTop: rs(16),
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  resetText: { fontSize: rf(15), fontWeight: "600" as const, color: Colors.primary },
  applyBtn: {
    flex: 1,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
    alignItems: "center",
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  applyText: { fontSize: rf(15), fontWeight: "700" as const, color: "#fff" },
});
