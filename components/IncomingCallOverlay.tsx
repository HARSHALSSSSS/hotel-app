import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";
import { getApiUrl } from "@/lib/query-client";

const RINGTONE_SOURCE = require("@/assets/audio/iphone_original.mp3");
const RINGTONE_FALLBACK_URL = "https://cdn.jsdelivr.net/npm/ringtones@1.0.4/Apple/Opening.mp3";

async function playRingtone(soundRef: React.MutableRefObject<Audio.Sound | null>) {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      allowsRecordingIOS: false,
    });
    const { sound } = await Audio.Sound.createAsync(RINGTONE_SOURCE, {
      shouldPlay: true,
      isLooping: true,
      volume: 1,
    });
    soundRef.current = sound;
  } catch {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: RINGTONE_FALLBACK_URL },
        { shouldPlay: true, isLooping: true, volume: 1 }
      );
      soundRef.current = sound;
    } catch {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: `${getApiUrl()}/assets/audio/iphone_original.mp3` },
          { shouldPlay: true, isLooping: true, volume: 1 }
        );
        soundRef.current = sound;
      } catch {
        /* no ringtone */
      }
    }
  }
}

async function stopRingtone(soundRef: React.MutableRefObject<Audio.Sound | null>) {
  const s = soundRef.current;
  soundRef.current = null;
  if (s) {
    try {
      await s.stopAsync();
      await s.unloadAsync();
    } catch {
      /* ignore */
    }
  }
}

export default function IncomingCallOverlay() {
  const { incomingCall, setIncomingCall } = useApp();
  const { width } = useWindowDimensions();
  const ringtoneRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (!incomingCall) {
      stopRingtone(ringtoneRef);
      return;
    }
    playRingtone(ringtoneRef);
    return () => {
      stopRingtone(ringtoneRef);
    };
  }, [!!incomingCall]);

  if (!incomingCall) return null;

  const handleAccept = () => {
    stopRingtone(ringtoneRef);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { callId, hotelId, hotelName, fromName } = incomingCall!;
    setIncomingCall(null);
    router.push({
      pathname: "/call",
      params: {
        callId,
        hotelId: hotelId || "",
        hotelName: hotelName || "Hotel",
        remoteName: fromName || "Guest",
        isIncoming: "1",
      },
    });
  };

  const handleDecline = () => {
    stopRingtone(ringtoneRef);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIncomingCall(null);
  };

  return (
    <Modal
      visible={!!incomingCall}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { width: Math.min(width - 48, 340) }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="call" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Incoming call</Text>
          <Text style={styles.callerName} numberOfLines={1}>
            {incomingCall.fromName}
          </Text>
          <Text style={styles.hotelName} numberOfLines={1}>
            {incomingCall.hotelName}
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.declineBtn, pressed && styles.btnPressed]}
              onPress={handleDecline}
            >
              <Ionicons name="close" size={28} color="#fff" />
              <Text style={styles.declineBtnText}>Decline</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.acceptBtn, pressed && styles.btnPressed]}
              onPress={handleAccept}
            >
              <Ionicons name="call" size={28} color="#fff" />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  callerName: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  hotelName: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ef4444",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.success,
  },
  btnPressed: {
    opacity: 0.9,
  },
  declineBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
