import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { Notification } from "@/lib/hotel-data";

function NotificationItem({ notif, index, onPress }: { notif: Notification; index: number; onPress: () => void }) {
  const iconMap: Record<string, string> = {
    booking: "calendar",
    promo: "pricetag",
    system: "information-circle",
  };

  const colorMap: Record<string, string> = {
    booking: Colors.success,
    promo: Colors.accent,
    system: Colors.primary,
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <Pressable
        style={[styles.notifCard, !notif.read && styles.notifUnread]}
        onPress={onPress}
      >
        <View style={[styles.notifIcon, { backgroundColor: colorMap[notif.type] + "15" }]}>
          <Ionicons name={iconMap[notif.type] as any} size={rs(20)} color={colorMap[notif.type]} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, !notif.read && styles.notifTitleBold]}>
              {notif.title}
            </Text>
            <Text style={styles.notifTime}>{timeAgo(notif.createdAt)}</Text>
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>
            {notif.message}
          </Text>
        </View>
        {!notif.read && <View style={styles.unreadDot} />}
      </Pressable>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationRead, markAllNotificationsRead, isAuthenticated } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const hasUnread = notifications.some((n) => !n.read);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: topInset + rs(8) }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={rs(22)} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: rs(80) }} />
        </View>
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={rs(48)} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Sign in to view notifications</Text>
          <Text style={styles.emptyText}>Your notifications will appear here</Text>
          <Pressable style={styles.signInBtn} onPress={() => router.push("/auth/login")}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + rs(8) }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={rs(22)} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread ? (
          <Pressable style={styles.markAllBtn} onPress={markAllNotificationsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: rs(80) }} />
        )}
      </View>

      {notifications.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={rs(48)} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyText}>You're all caught up!</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + rs(16) }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <NotificationItem
              notif={item}
              index={index}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                markNotificationRead(item.id);
              }}
            />
          )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rs(16),
    paddingBottom: rs(12),
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  markAllBtn: {
    paddingVertical: rs(8),
    paddingHorizontal: rs(12),
    justifyContent: "center",
    minHeight: MIN_TOUCH,
  },
  markAllText: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  list: {
    padding: rs(20),
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.card,
    borderRadius: rs(14),
    padding: rs(14),
    marginBottom: rs(10),
    position: "relative",
    minHeight: MIN_TOUCH,
  },
  notifUnread: {
    backgroundColor: Colors.primary + "06",
    borderWidth: 1,
    borderColor: Colors.primary + "15",
  },
  notifIcon: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: rs(12),
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: rs(4),
  },
  notifTitle: {
    fontSize: rf(14),
    fontWeight: "500" as const,
    color: Colors.text,
    flex: 1,
    marginRight: rs(8),
  },
  notifTitleBold: {
    fontWeight: "700" as const,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  notifMessage: {
    fontSize: rf(13),
    color: Colors.textSecondary,
    lineHeight: rf(18),
  },
  unreadDot: {
    position: "absolute",
    top: rs(16),
    right: rs(14),
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: Colors.primary,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: rs(8),
    paddingBottom: rs(80),
  },
  emptyTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: rs(8),
  },
  emptyText: {
    fontSize: rf(14),
    color: Colors.textSecondary,
  },
  signInBtn: {
    marginTop: rs(16),
    backgroundColor: Colors.primary,
    paddingVertical: rs(14),
    paddingHorizontal: rs(28),
    borderRadius: rs(12),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  signInBtnText: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
});
