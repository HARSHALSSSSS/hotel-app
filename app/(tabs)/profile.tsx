import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import { getUserProfile, UserProfile } from "@/lib/storage";
import { router } from "expo-router";

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { icon: "person-outline" as const, label: "Personal Info", route: null },
      { icon: "card-outline" as const, label: "Payment Methods", route: null },
      { icon: "notifications-outline" as const, label: "Notifications", route: "/notifications" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "help-circle-outline" as const, label: "Help Center", route: null },
      { icon: "chatbubble-outline" as const, label: "Contact Us", route: null },
      { icon: "star-outline" as const, label: "Rate App", route: null },
    ],
  },
  {
    title: "Legal",
    items: [
      { icon: "document-text-outline" as const, label: "Terms of Service", route: null },
      { icon: "shield-outline" as const, label: "Privacy Policy", route: null },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, bookings } = useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    getUserProfile().then(setProfile);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 100 }}
      >
        <View style={[styles.profileHeader, { paddingTop: topInset + 20 }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: profile?.avatar || Colors.primary }]}>
              <Text style={styles.avatarText}>
                {(profile?.name || "G").charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>{profile?.name || "Guest User"}</Text>
          <Text style={styles.profileEmail}>{profile?.email || "guest@stayease.com"}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bookings.length}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{favorites.length}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {MENU_SECTIONS.map((section, sIdx) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(sIdx * 100).duration(400)}
            style={styles.menuSection}
          >
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (item.route) {
                      router.push(item.route as any);
                    }
                  }}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBg}>
                      <Ionicons name={item.icon} size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.logoutSection}>
          <Pressable
            style={styles.logoutBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.version}>StayEase v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileHeader: {
    alignItems: "center",
    paddingBottom: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#fff",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 40,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.error + "40",
    backgroundColor: Colors.error + "08",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.error,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 20,
    marginBottom: 10,
  },
});
