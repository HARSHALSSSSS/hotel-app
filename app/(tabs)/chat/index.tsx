import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { authFetch } from "@/lib/auth";

const SUPPORT_EMAIL = "support@hotelbookinghub.com";

export type ChatConversationItem = {
  id: string;
  otherUser: { id: string; name: string; avatar: string | null } | null;
  lastMessage: { content: string; type: string; createdAt: string } | null;
  lastMessageAt: string | null;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useApp();
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await authFetch("/api/chat/conversations");
      if (res.ok) setConversations(await res.json());
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = search.trim()
    ? conversations.filter(
        (c) => c.otherUser?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const handleStartWithSupport = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSupportLoading(true);
    try {
      const supportRes = await authFetch("/api/chat/support-user");
      if (!supportRes.ok) {
        const err = await supportRes.json().catch(() => ({}));
        Alert.alert("Unable to chat", err?.message || "Support is temporarily unavailable. Please try again later.");
        return;
      }
      const support = await supportRes.json();
      const convoRes = await authFetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: support.id }),
      });
      if (!convoRes.ok) {
        const err = await convoRes.json().catch(() => ({}));
        Alert.alert("Unable to start chat", err?.message || "Could not start conversation. Please try again.");
        return;
      }
      const convo = await convoRes.json();
      const otherName = support.name || "Hotel Support";
      const otherAvatar = support.avatar || "";
      router.push({
        pathname: "/(tabs)/chat/[id]",
        params: { id: convo.id, otherName, otherAvatar },
      });
    } catch (e: any) {
      Alert.alert("Chat error", e?.message || "Could not open chat. Please check your connection and try again.");
    } finally {
      setSupportLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topInset }]}>
        <Text style={styles.loginPrompt}>Sign in to view your chats</Text>
        <Pressable
          style={styles.signInBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/auth/login");
          }}
        >
          <Text style={styles.signInBtnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + rs(12) }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace("/(tabs)");
          }}
        >
          <Ionicons name="arrow-back" size={rs(24)} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={rs(20)} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {user?.email === SUPPORT_EMAIL && (
        <View style={styles.supportBanner}>
          <Ionicons name="headset" size={rs(22)} color={Colors.primary} />
          <View style={styles.supportBannerText}>
            <Text style={styles.supportBannerTitle}>Logged in as Hotel Support</Text>
            <Text style={styles.supportBannerSub}>You’ll receive guest messages and incoming calls here.</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={[styles.empty, { paddingBottom: bottomInset + rs(80) }]}>
          <Ionicons name="chatbubbles-outline" size={rs(56)} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>Start a chat with support</Text>
          <Pressable
            style={[styles.startBtn, supportLoading && styles.startBtnDisabled]}
            onPress={handleStartWithSupport}
            disabled={supportLoading}
          >
            {supportLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.startBtnText}>Message Support</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={styles.listBg}
          contentContainerStyle={[styles.list, { paddingBottom: rs(24) + bottomInset + rs(80) }]}
          renderItem={({ item }) => (
            <Pressable
              style={styles.chatRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/(tabs)/chat/[id]",
                  params: {
                    id: item.id,
                    otherName: item.otherUser?.name || "User",
                    otherAvatar: item.otherUser?.avatar || "",
                  },
                });
              }}
            >
              <View style={styles.avatarWrap}>
                {item.otherUser?.avatar ? (
                  <Image source={{ uri: item.otherUser.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={rs(28)} color={Colors.textTertiary} />
                  </View>
                )}
                <View style={styles.onlineDot} />
              </View>
              <View style={styles.chatMiddle}>
                <Text style={styles.chatName} numberOfLines={1}>{item.otherUser?.name || "User"}</Text>
                <Text style={styles.chatPreview} numberOfLines={1}>
                  {item.lastMessage?.content || "No messages yet"}
                </Text>
              </View>
              <Text style={styles.chatTime}>
                {item.lastMessage?.createdAt ? formatTime(item.lastMessage.createdAt) : ""}
              </Text>
            </Pressable>
          )}
        />
      )}

      {!loading && filtered.length > 0 && (
        <Pressable
          style={[styles.fab, { bottom: bottomInset + rs(80) }, supportLoading && styles.fabDisabled]}
          onPress={handleStartWithSupport}
          disabled={supportLoading}
        >
          {supportLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="add" size={rs(28)} color="#fff" />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  centered: { justifyContent: "center", alignItems: "center" },
  loginPrompt: { fontSize: rf(16), color: "rgba(255,255,255,0.9)", marginBottom: rs(16) },
  signInBtn: { backgroundColor: "#fff", paddingHorizontal: rs(28), paddingVertical: rs(14), borderRadius: rs(12), minHeight: MIN_TOUCH, justifyContent: "center" as const },
  signInBtnText: { fontSize: rf(16), fontWeight: "700" as const, color: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(16),
    paddingBottom: rs(16),
  },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: rf(20), fontWeight: "800" as const, color: "#fff" },
  headerSpacer: { width: rs(40) },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: rs(20),
    marginBottom: rs(16),
    paddingHorizontal: rs(14),
    borderRadius: rs(12),
    gap: rs(10),
    minHeight: Math.max(rs(48), MIN_TOUCH),
  },
  searchInput: { flex: 1, fontSize: rf(16), color: Colors.text, paddingVertical: rs(12) },
  supportBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "12",
    marginHorizontal: rs(20),
    marginBottom: rs(16),
    padding: rs(14),
    borderRadius: rs(12),
    gap: rs(12),
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  supportBannerText: { flex: 1 },
  supportBannerTitle: {
    fontSize: rf(15),
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: rs(4),
  },
  supportBannerSub: {
    fontSize: rf(13),
    color: Colors.textSecondary,
    lineHeight: rf(18),
  },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  listBg: { flex: 1, backgroundColor: "#fff" },
  list: { paddingHorizontal: rs(20), paddingTop: rs(8) },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: rs(14),
    padding: rs(14),
    marginBottom: rs(12),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  avatarWrap: { position: "relative", marginRight: rs(14) },
  avatar: { width: rs(52), height: rs(52), borderRadius: rs(26) },
  avatarPlaceholder: { backgroundColor: Colors.borderLight, alignItems: "center", justifyContent: "center" },
  onlineDot: {
    position: "absolute",
    bottom: rs(2),
    left: rs(2),
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: "#fff",
  },
  chatMiddle: { flex: 1, minWidth: 0 },
  chatName: { fontSize: rf(16), fontWeight: "700" as const, color: Colors.text, marginBottom: rs(2) },
  chatPreview: { fontSize: rf(14), color: Colors.textSecondary },
  chatTime: { fontSize: rf(12), color: Colors.textTertiary, marginLeft: rs(8) },
  empty: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", paddingHorizontal: rs(40) },
  emptyTitle: { fontSize: rf(18), fontWeight: "700" as const, color: Colors.text, marginTop: rs(12) },
  emptySub: { fontSize: rf(14), color: Colors.textSecondary, marginTop: rs(4) },
  startBtn: { marginTop: rs(20), backgroundColor: Colors.primary, paddingHorizontal: rs(24), paddingVertical: rs(14), borderRadius: rs(12), minHeight: Math.max(rs(48), MIN_TOUCH), alignItems: "center" as const, justifyContent: "center" as const },
  startBtnText: { fontSize: rf(16), fontWeight: "700" as const, color: "#fff" },
  startBtnDisabled: { opacity: 0.7 },
  fab: {
    position: "absolute",
    right: rs(20),
    width: Math.max(rs(56), MIN_TOUCH),
    height: Math.max(rs(56), MIN_TOUCH),
    borderRadius: rs(28),
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  fabDisabled: { opacity: 0.7 },
});
