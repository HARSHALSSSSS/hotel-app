import React, { useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Alert } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { router } from "expo-router";

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { icon: "person-outline" as const, label: "Your Profile", route: "/profile/edit" },
      { icon: "calendar-outline" as const, label: "My Bookings", route: "/profile/bookings" },
      { icon: "wallet-outline" as const, label: "My Wallet", route: "/profile/wallet" },
      { icon: "card-outline" as const, label: "Payment Methods", route: "/profile/payment-methods" },
      { icon: "notifications-outline" as const, label: "Notifications", route: "/notifications" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "help-circle-outline" as const, label: "Help Center", route: "/profile/help-center" },
      { icon: "chatbubble-outline" as const, label: "Contact Us", route: "/(tabs)/chat" },
      { icon: "star-outline" as const, label: "Rate App", route: null },
    ],
  },
  {
    title: "Settings",
    items: [
      { icon: "settings-outline" as const, label: "Settings", route: "/profile/settings" },
    ],
  },
  {
    title: "Legal",
    items: [
      { icon: "document-text-outline" as const, label: "Terms of Service", route: "/profile/terms" },
      { icon: "shield-outline" as const, label: "Privacy Policy", route: "/profile/privacy-policy" },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, favorites, bookings, logout, refreshUser, isAuthenticated } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (isAuthenticated) refreshUser();
  }, [isAuthenticated, refreshUser]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(tabs)/profile");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? rs(34) : rs(100) }}
      >
        <View style={[styles.profileHeader, { paddingTop: topInset + rs(20) }]}>
          <View style={styles.avatarContainer}>
            {user?.avatar && !String(user.avatar).startsWith("#") ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                <Text style={styles.avatarText}>
                  {(user?.name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{user?.name || "Account"}</Text>
          {user?.email ? <Text style={styles.profileEmail}>{user.email}</Text> : null}
          {user != null && (
            <>
              <Text style={styles.walletBalance}>Wallet: ₹{(user?.walletBalance ?? 0).toLocaleString("en-IN")}</Text>
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
                  <Text style={styles.statValue}>{bookings.filter((b) => b.status === "completed").length}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            </>
          )}
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
                    } else if (item.label === "Rate App") {
                      Alert.alert("Rate Us", "Thank you for using StayEase! Rating is available on the App Store / Play Store.");
                    }
                  }}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBg}>
                      <Ionicons name={item.icon} size={rs(18)} color={Colors.primary} />
                    </View>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={rs(18)} color={Colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.logoutSection}>
          {user ? (
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={rs(20)} color={Colors.error} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.signInBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/auth/login");
              }}
            >
              <Ionicons name="log-in-outline" size={rs(20)} color={Colors.primary} />
              <Text style={styles.signInBtnText}>Sign In</Text>
            </Pressable>
          )}
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
    paddingBottom: rs(24),
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  avatarContainer: {
    marginBottom: rs(12),
  },
  avatar: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
  },
  avatarText: {
    fontSize: rf(32),
    fontWeight: "700" as const,
    color: "#fff",
  },
  profileName: {
    fontSize: rf(22),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  profileEmail: {
    fontSize: rf(14),
    color: Colors.textSecondary,
    marginTop: rs(4),
  },
  walletBalance: {
    fontSize: rf(13),
    fontWeight: "600" as const,
    color: Colors.primary,
    marginTop: rs(6),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: rs(20),
    paddingHorizontal: rs(40),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: rf(20),
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: rf(12),
    color: Colors.textSecondary,
    marginTop: rs(2),
  },
  statDivider: {
    width: 1,
    height: rs(30),
    backgroundColor: Colors.border,
  },
  menuSection: {
    paddingHorizontal: rs(20),
    marginTop: rs(24),
  },
  menuSectionTitle: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: rs(8),
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: rs(16),
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
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
    minHeight: MIN_TOUCH,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(12),
  },
  menuIconBg: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(10),
    backgroundColor: Colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: rf(15),
    fontWeight: "500" as const,
    color: Colors.text,
  },
  logoutSection: {
    paddingHorizontal: rs(20),
    marginTop: rs(24),
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    paddingVertical: rs(16),
    borderRadius: rs(14),
    borderWidth: 1.5,
    borderColor: Colors.error + "40",
    backgroundColor: Colors.error + "08",
    minHeight: MIN_TOUCH,
  },
  logoutText: {
    fontSize: rf(15),
    fontWeight: "600" as const,
    color: Colors.error,
  },
  version: {
    textAlign: "center",
    fontSize: rf(12),
    color: Colors.textTertiary,
    marginTop: rs(20),
    marginBottom: rs(10),
  },
  authButtons: {
    marginTop: 24,
    gap: 12,
    paddingHorizontal: 24,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    backgroundColor: Colors.primary,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    minHeight: MIN_TOUCH,
  },
  signInBtnText: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
  createAccountBtn: {
    paddingVertical: rs(16),
    borderRadius: rs(14),
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  createAccountBtnText: {
    fontSize: rf(16),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
