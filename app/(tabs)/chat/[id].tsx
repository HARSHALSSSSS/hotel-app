import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { KeyboardStickyView, useKeyboardState } from "react-native-keyboard-controller";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { getApiUrl } from "@/lib/query-client";

const TAB_BAR_HEIGHT = rs(84);
import { authFetch, getToken } from "@/lib/auth";
import { connectRealtime } from "@/lib/realtime";

type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string | null;
  content: string;
  type: string;
  createdAt: string;
};

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
}

export default function ChatConversationScreen() {
  const p = useLocalSearchParams<{ id: string; otherName?: string; otherAvatar?: string }>();
  const id = typeof p.id === "string" ? p.id : p.id?.[0];
  const otherName = typeof p.otherName === "string" ? p.otherName : p.otherName?.[0];
  const otherAvatar = typeof p.otherAvatar === "string" ? p.otherAvatar : p.otherAvatar?.[0];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const listRef = useRef<FlatList>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const keyboardVisible = useKeyboardState((s) => s.isVisible);
  const myId = user?.id ?? "";

  const loadMessages = useCallback(async () => {
    if (!id) return;
    try {
      const res = await authFetch(`/api/chat/conversations/${id}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const unsubscribe = connectRealtime((msg) => {
      if (msg.type === "chat:message" && msg.data.conversationId === id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.data.id)) return prev;
          return [...prev, msg.data as MessageItem];
        });
      }
    });
    return unsubscribe;
  }, [id]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !id || sending) return;
    setSending(true);
    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await authFetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id, content: text, type: "text" }),
      });
      if (res.ok) {
        const sent = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        setInput(text);
      }
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (!id || sending) return;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Microphone", "Microphone access is required for voice notes.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, staysActiveInBackground: false, shouldDuckAndroid: true, playThroughEarpieceAndroid: false });
      const { recording: r } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(r);
      setRecordingSecs(0);
      recordingTimer.current = setInterval(() => setRecordingSecs((s) => s + 1), 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      Alert.alert("Recording", "Could not start recording. Please try again.");
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording || !id) return;
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    setSending(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordingSecs(0);
      if (!uri) {
        setSending(false);
        return;
      }
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", { uri, type: "audio/m4a", name: "voice.m4a" } as any);
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Upload failed");
      }
      const { url } = await res.json();
      const fullUrl = url.startsWith("http") ? url : `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
      const msgRes = await authFetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id, content: fullUrl, type: "audio" }),
      });
      if (msgRes.ok) {
        const sent = await msgRes.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (e) {
      Alert.alert("Voice note", (e as Error)?.message || "Could not send voice note.");
    } finally {
      setSending(false);
    }
  };

  const cancelRecording = async () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }
    setRecordingSecs(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!id) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid chat</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const hasText = input.trim().length > 0;
  const inputBarPadding = keyboardVisible
    ? rs(10) + TAB_BAR_HEIGHT
    : bottomInset + rs(12) + TAB_BAR_HEIGHT;
  const InputBar = (
    <View style={[styles.inputRow, { paddingBottom: inputBarPadding }]}>
      {!recording ? (
        <Pressable style={styles.attachBtn}>
          <Ionicons name="add" size={rs(26)} color="#fff" />
        </Pressable>
      ) : (
        <Pressable style={styles.cancelRecordBtn} onPress={cancelRecording}>
          <Text style={styles.cancelRecordText}>Cancel</Text>
        </Pressable>
      )}
      {recording ? (
        <View style={styles.recordingRow}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingTimer}>
            {Math.floor(recordingSecs / 60)}:{(recordingSecs % 60).toString().padStart(2, "0")}
          </Text>
          <Pressable style={styles.sendVoiceBtn} onPress={stopRecordingAndSend} disabled={sending}>
            <Ionicons name="send" size={rs(22)} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message here..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={2000}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            editable={!sending}
            blurOnSubmit={false}
          />
          {hasText ? (
            <Pressable style={styles.sendBtn} onPress={sendMessage} disabled={sending}>
              <Ionicons name="send" size={rs(22)} color="#fff" />
            </Pressable>
          ) : (
            <Pressable style={styles.micBtn} onPress={startRecording} disabled={sending}>
              <Ionicons name="mic" size={rs(22)} color="#fff" />
            </Pressable>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + rs(12) }]}>
        <Pressable style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={rs(24)} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          {otherAvatar ? (
            <Image source={{ uri: otherAvatar }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={rs(24)} color="#fff" />
            </View>
          )}
          <View style={styles.headerNames}>
            <Text style={styles.headerName} numberOfLines={1}>{otherName || "Chat"}</Text>
            <Text style={styles.headerOnline}>Online</Text>
          </View>
        </View>
        <Pressable style={styles.headerMenu}>
          <Ionicons name="ellipsis-vertical" size={rs(22)} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            <Text style={styles.dateLabel}>TODAY</Text>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.messagesList, { paddingBottom: rs(24) + rs(68) + TAB_BAR_HEIGHT + bottomInset }]}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isMe = item.senderId === myId;
                return (
                  <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                    {!isMe && (
                      <View style={styles.msgAvatarWrap}>
                        {item.senderAvatar ? (
                          <Image source={{ uri: item.senderAvatar }} style={styles.msgAvatar} />
                        ) : (
                          <View style={[styles.msgAvatar, styles.avatarPlaceholder]}>
                            <Ionicons name="person" size={rs(16)} color={Colors.textTertiary} />
                          </View>
                        )}
                      </View>
                    )}
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                      {item.type === "text" && (
                        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
                      )}
                      {item.type === "image" && (
                        <Image source={{ uri: item.content }} style={styles.bubbleImage} contentFit="cover" />
                      )}
                      {item.type === "audio" && (
                        <View style={styles.audioRow}>
                          <Ionicons name="play-circle" size={rs(32)} color={isMe ? "#fff" : Colors.text} />
                          <View style={styles.waveform} />
                          <Text style={[styles.audioDuration, isMe && styles.audioDurationMe]}>0:13</Text>
                        </View>
                      )}
                      <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
                        {formatMessageTime(item.createdAt)}
                      </Text>
                    </View>
                    {isMe && (
                      <View style={styles.msgAvatarWrap}>
                        {user?.avatar ? (
                          <Image source={{ uri: user.avatar }} style={styles.msgAvatar} />
                        ) : (
                          <View style={[styles.msgAvatar, styles.avatarPlaceholder]}>
                            <Ionicons name="person" size={rs(16)} color={Colors.textTertiary} />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              }}
            />
          </>
        )}
      </View>

      {Platform.OS === "web" ? (
        InputBar
      ) : (
        <KeyboardStickyView
          offset={{ closed: 0, opened: -TAB_BAR_HEIGHT }}
          style={styles.stickyInputWrap}
        >
          {InputBar}
        </KeyboardStickyView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  errorText: { fontSize: rf(16), color: Colors.textSecondary, textAlign: "center", marginTop: rs(40) },
  backLink: { fontSize: rf(16), color: Colors.primary, textAlign: "center", marginTop: rs(12), minHeight: MIN_TOUCH, justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: rs(12),
    paddingBottom: rs(14),
    backgroundColor: Colors.primary,
  },
  headerBack: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: rs(12) },
  headerAvatar: { width: rs(40), height: rs(40), borderRadius: rs(20) },
  avatarPlaceholder: { backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  headerNames: { alignItems: "center" },
  headerName: { fontSize: rf(17), fontWeight: "700" as const, color: "#fff" },
  headerOnline: { fontSize: rf(12), color: "rgba(255,255,255,0.85)" },
  headerMenu: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, backgroundColor: "#fff" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  dateLabel: {
    textAlign: "center" as const,
    fontSize: rf(12),
    color: Colors.textTertiary,
    marginVertical: rs(12),
  },
  messagesList: { paddingHorizontal: rs(16) },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: rs(12) },
  messageRowMe: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  msgAvatarWrap: { marginHorizontal: rs(6) },
  msgAvatar: { width: rs(28), height: rs(28), borderRadius: rs(14) },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: rs(14),
    paddingVertical: rs(10),
    borderRadius: rs(16),
  },
  bubbleMe: { backgroundColor: Colors.primary },
  bubbleOther: { backgroundColor: "#F0F0F0" },
  bubbleText: { fontSize: rf(15), color: Colors.text },
  bubbleTextMe: { color: "#fff" },
  bubbleTime: { fontSize: rf(11), marginTop: rs(4) },
  bubbleTimeMe: { color: "rgba(255,255,255,0.85)" },
  bubbleTimeOther: { color: Colors.textTertiary },
  bubbleImage: { width: rs(200), height: rs(140), borderRadius: rs(12) },
  audioRow: { flexDirection: "row", alignItems: "center", gap: rs(10) },
  waveform: { width: rs(80), height: rs(24), backgroundColor: "rgba(0,0,0,0.1)", borderRadius: rs(4) },
  audioDuration: { fontSize: rf(12), color: Colors.textSecondary },
  audioDurationMe: { color: "rgba(255,255,255,0.9)" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: rs(12),
    paddingTop: rs(12),
    gap: rs(10),
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  attachBtn: {
    width: Math.max(rs(44), MIN_TOUCH),
    height: Math.max(rs(44), MIN_TOUCH),
    borderRadius: rs(22),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: Math.max(rs(44), MIN_TOUCH),
    maxHeight: rs(120),
    backgroundColor: "#F0F0F0",
    borderRadius: rs(22),
    paddingHorizontal: rs(18),
    paddingVertical: rs(12),
    fontSize: rf(16),
    color: Colors.text,
  },
  micBtn: {
    width: Math.max(rs(44), MIN_TOUCH),
    height: Math.max(rs(44), MIN_TOUCH),
    borderRadius: rs(22),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    width: Math.max(rs(44), MIN_TOUCH),
    height: Math.max(rs(44), MIN_TOUCH),
    borderRadius: rs(22),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelRecordBtn: { paddingHorizontal: rs(12), justifyContent: "center", minHeight: MIN_TOUCH },
  cancelRecordText: { fontSize: rf(15), fontWeight: "600" as const, color: Colors.primary },
  recordingRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: rs(12),
    paddingVertical: rs(8),
  },
  recordingDot: {
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
    backgroundColor: Colors.error,
  },
  recordingTimer: { fontSize: rf(16), color: Colors.textSecondary, flex: 1 },
  sendVoiceBtn: {
    width: Math.max(rs(44), MIN_TOUCH),
    height: Math.max(rs(44), MIN_TOUCH),
    borderRadius: rs(22),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyInputWrap: {
    backgroundColor: "#fff",
  },
});
