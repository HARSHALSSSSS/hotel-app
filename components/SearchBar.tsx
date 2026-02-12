import React from "react";
import { StyleSheet, View, TextInput, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({ value, onChangeText, placeholder = "Search hotels, destinations...", onFilterPress, autoFocus }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>
      {onFilterPress && (
        <Pressable style={styles.filterButton} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={20} color={Colors.textInverse} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
