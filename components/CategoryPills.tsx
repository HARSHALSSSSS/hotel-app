import React from "react";
import { StyleSheet, ScrollView, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf } from "@/constants/responsive";
import { CATEGORIES } from "@/lib/hotel-data";

interface CategoryPillsProps {
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <Pressable
            key={cat.id}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(cat.id);
            }}
          >
            <Ionicons
              name={cat.icon as any}
              size={rs(16)}
              color={isActive ? Colors.textInverse : Colors.textSecondary}
            />
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{cat.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: rs(20),
    gap: rs(8),
    paddingVertical: rs(4),
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    paddingHorizontal: rs(16),
    paddingVertical: rs(10),
    borderRadius: rs(24),
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: rf(13),
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.textInverse,
  },
});
