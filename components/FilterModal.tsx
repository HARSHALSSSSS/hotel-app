import React, { useState } from "react";
import { StyleSheet, View, Text, Modal, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";

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
  { label: "Any", min: 0, max: 200000 },
  { label: "₹0-20K", min: 0, max: 20000 },
  { label: "₹20K-40K", min: 20000, max: 40000 },
  { label: "₹40K-60K", min: 40000, max: 60000 },
  { label: "₹60K+", min: 60000, max: 200000 },
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
  maxPrice: 200000,
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
        <View style={[styles.container, { paddingBottom: insets.bottom + rs(16) }]}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>Filters</Text>
              <Pressable onPress={onClose} hitSlop={rs(8)}>
                <Ionicons name="close" size={rs(24)} color={Colors.text} />
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
                  {r.value > 0 && <Ionicons name="star" size={rs(12)} color={filters.minRating === r.value ? "#fff" : Colors.star} />}
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
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    maxHeight: "80%",
  },
  header: {
    alignItems: "center",
    paddingTop: rs(8),
  },
  handle: {
    width: rs(40),
    height: rs(4),
    borderRadius: rs(2),
    backgroundColor: Colors.border,
    marginBottom: rs(16),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: rs(20),
    paddingBottom: rs(16),
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: rf(20),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  content: {
    padding: rs(20),
  },
  sectionTitle: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: rs(12),
    marginTop: rs(8),
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(8),
    marginBottom: rs(20),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    paddingHorizontal: rs(16),
    paddingVertical: rs(10),
    borderRadius: rs(12),
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: rf(13),
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
  },
  sortList: {
    gap: rs(4),
    marginBottom: rs(20),
  },
  sortItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: rs(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sortText: {
    fontSize: rf(15),
    color: Colors.textSecondary,
  },
  sortTextActive: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  radio: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
    backgroundColor: Colors.primary,
  },
  footer: {
    flexDirection: "row",
    gap: rs(12),
    paddingHorizontal: rs(20),
    paddingTop: rs(12),
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  resetText: {
    fontSize: rf(15),
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
    alignItems: "center",
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  applyText: {
    fontSize: rf(15),
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
});
