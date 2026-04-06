import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Text, Pressable, Platform, ScrollView, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";

const NOTIF_SETTINGS_KEY = "@stayease_notif_settings";

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [promos, setPromos] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (typeof saved.push === "boolean") setPushEnabled(saved.push);
        if (typeof saved.email === "boolean") setEmailEnabled(saved.email);
        if (typeof saved.reminders === "boolean") setBookingReminders(saved.reminders);
        if (typeof saved.promos === "boolean") setPromos(saved.promos);
      } catch {}
    });
  }, []);

  const persist = useCallback((p: boolean, e: boolean, r: boolean, pr: boolean) => {
    AsyncStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify({ push: p, email: e, reminders: r, promos: pr })).catch(() => {});
  }, []);

  const toggle = (value: boolean, setValue: (v: boolean) => void, key: "push" | "email" | "reminders" | "promos") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !value;
    setValue(newVal);
    const next = { push: pushEnabled, email: emailEnabled, reminders: bookingReminders, promos, [key]: newVal };
    persist(next.push, next.email, next.reminders, next.promos);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Push notifications</Text>
            <Switch
              value={pushEnabled}
              onValueChange={() => toggle(pushEnabled, setPushEnabled, "push")}
              trackColor={{ false: Colors.border, true: Colors.primary + "80" }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Email notifications</Text>
            <Switch
              value={emailEnabled}
              onValueChange={() => toggle(emailEnabled, setEmailEnabled, "email")}
              trackColor={{ false: Colors.border, true: Colors.primary + "80" }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Booking reminders</Text>
            <Switch
              value={bookingReminders}
              onValueChange={() => toggle(bookingReminders, setBookingReminders, "reminders")}
              trackColor={{ false: Colors.border, true: Colors.primary + "80" }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Promotions and offers</Text>
            <Switch
              value={promos}
              onValueChange={() => toggle(promos, setPromos, "promos")}
              trackColor={{ false: Colors.border, true: Colors.primary + "80" }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center" as const,
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLabel: { fontSize: 16, fontWeight: "500" as const, color: Colors.text },
});
