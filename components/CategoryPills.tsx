import React from "react";
import { StyleSheet, ScrollView, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
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
              size={16}
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
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.textInverse,
  },
});
