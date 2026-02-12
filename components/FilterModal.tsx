import React, { useState } from "react";
import { StyleSheet, View, Text, Modal, Pressable, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sortBy: "price_low" | "price_high" | "rating" | "popular";
}

const PRICE_RANGES = [
  { label: "Any", min: 0, max: 1000 },
  { label: "$0-200", min: 0, max: 200 },
  { label: "$200-400", min: 200, max: 400 },
  { label: "$400-600", min: 400, max: 600 },
  { label: "$600+", min: 600, max: 10000 },
];

const RATINGS = [
  { label: "Any", value: 0 },
  { label: "4.0+", value: 4.0 },
  { label: "4.5+", value: 4.5 },
  { label: "4.7+", value: 4.7 },
];

const SORT_OPTIONS: { label: string; value: FilterState["sortBy"] }[] = [
  { label: "Most Popular", value: "popular" },
  { label: "Price: Low to High", value: "price_low" },
  { label: "Price: High to Low", value: "price_high" },
  { label: "Highest Rated", value: "rating" },
];

export const DEFAULT_FILTERS: FilterState = {
  minPrice: 0,
  maxPrice: 1000,
  minRating: 0,
  sortBy: "popular",
};

export default function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const selectedPriceIdx = PRICE_RANGES.findIndex(
    (r) => r.min === filters.minPrice && r.max === filters.maxPrice
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Filters</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.optionsRow}>
              {PRICE_RANGES.map((range, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.chip, selectedPriceIdx === idx && styles.chipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilters({ ...filters, minPrice: range.min, maxPrice: range.max });
                  }}
                >
                  <Text style={[styles.chipText, selectedPriceIdx === idx && styles.chipTextActive]}>
                    {range.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.optionsRow}>
              {RATINGS.map((r, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.chip, filters.minRating === r.value && styles.chipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilters({ ...filters, minRating: r.value });
                  }}
                >
                  {r.value > 0 && <Ionicons name="star" size={12} color={filters.minRating === r.value ? "#fff" : Colors.star} />}
                  <Text style={[styles.chipText, filters.minRating === r.value && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.sortList}>
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={styles.sortItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilters({ ...filters, sortBy: opt.value });
                  }}
                >
                  <Text style={[styles.sortText, filters.sortBy === opt.value && styles.sortTextActive]}>
                    {opt.label}
                  </Text>
                  <View style={[styles.radio, filters.sortBy === opt.value && styles.radioActive]}>
                    {filters.sortBy === opt.value && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={styles.resetBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilters(DEFAULT_FILTERS);
              }}
            >
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
            <Pressable
              style={styles.applyBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onApply(filters);
                onClose();
              }}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  header: {
    alignItems: "center",
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  sortList: {
    gap: 4,
    marginBottom: 20,
  },
  sortItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sortText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  sortTextActive: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
  },
  resetText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  applyText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
});
