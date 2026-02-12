import React from "react";
import { StyleSheet, View, Text, FlatList, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import { HOTELS } from "@/lib/hotel-data";
import HotelCard from "@/components/HotelCard";

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { favorites } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const savedHotels = HOTELS.filter((h) => favorites.includes(h.id));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={styles.title}>Saved Hotels</Text>
        <Text style={styles.subtitle}>{savedHotels.length} saved</Text>
      </View>

      {savedHotels.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No saved hotels yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart icon on any hotel to save it here
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={savedHotels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <HotelCard hotel={item} index={index} variant="compact" />
          )}
          ListFooterComponent={<View style={{ height: Platform.OS === "web" ? 34 : 100 }} />}
        />
      )}
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
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  list: {
    padding: 20,
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
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
