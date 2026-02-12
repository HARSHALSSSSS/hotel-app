import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
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
          <Ionicons name={iconMap[notif.type] as any} size={20} color={colorMap[notif.type]} />
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
  const { notifications, markNotificationRead } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {notifications.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyText}>You're all caught up!</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 16 }]}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  list: {
    padding: 20,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    position: "relative",
  },
  notifUnread: {
    backgroundColor: Colors.primary + "06",
    borderWidth: 1,
    borderColor: Colors.primary + "15",
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  notifTitleBold: {
    fontWeight: "700" as const,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  notifMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
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
  },
});
