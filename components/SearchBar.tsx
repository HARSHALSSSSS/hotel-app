import React from "react";
import { StyleSheet, View, TextInput, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";

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
        <Ionicons name="search" size={rs(20)} color={Colors.textSecondary} />
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
            <Ionicons name="close-circle" size={rs(18)} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>
      {onFilterPress && (
        <Pressable style={styles.filterButton} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={rs(20)} color={Colors.textInverse} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
  },
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: rs(14),
    paddingHorizontal: rs(14),
    paddingVertical: Platform.OS === "ios" ? rs(12) : rs(8),
    gap: rs(10),
  },
  input: {
    flex: 1,
    fontSize: rf(15),
    color: Colors.text,
  },
  filterButton: {
    width: Math.max(rs(46), MIN_TOUCH),
    height: Math.max(rs(46), MIN_TOUCH),
    borderRadius: rs(14),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
