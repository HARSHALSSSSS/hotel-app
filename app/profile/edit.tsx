import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { useApp } from "@/lib/app-context";

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const COUNTRY_CODES = ["+1", "+44", "+91", "+81", "+86", "+33", "+49", "+61", "+971"];

export default function YourProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUserProfile, refreshUser, isAuthenticated } = useApp();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/auth/login");
  }, [isAuthenticated]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setGender(user.gender ?? "");
      setPhone("");
      if (user.phone) {
        const match = user.phone.trim().match(/^(\+\d+)\s*(.*)$/);
        if (match) {
          setCountryCode(match[1]);
          setPhone(match[2].trim());
        } else setPhone(user.phone.trim());
      }
      setAvatarUri(user.avatar ? String(user.avatar) : null);
    }
  }, [user?.id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to photos to set profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  };

  if (!isAuthenticated) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const fullPhone = (countryCode + " " + phone.trim()).trim();
      await updateUserProfile({
        name: name.trim(),
        phone: fullPhone || undefined,
        gender: gender || undefined,
        avatar: avatarUri && (avatarUri.startsWith("http") || avatarUri.startsWith("data:")) ? avatarUri : undefined,
      });
      await refreshUser();
      router.back();
    } catch (e: any) {
      Alert.alert("Update failed", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={topInset}
    >
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.avatarWrap} onPress={pickImage}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color={Colors.textTertiary} />
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </Pressable>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="John Doe"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="words"
          editable={!loading}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={email}
          placeholder="example@gmail.com"
          placeholderTextColor={Colors.textTertiary}
          editable={false}
        />
        <Text style={styles.label}>Gender</Text>
        <Pressable
          style={styles.input}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowGenderPicker(true);
          }}
        >
          <Text style={gender ? styles.inputValue : styles.inputPlaceholder}>{gender || "Select"}</Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textTertiary} />
        </Pressable>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <Pressable
            style={styles.countryCodeBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCodePicker(true);
            }}
          >
            <Text style={styles.countryCodeText}>{countryCode}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
          </Pressable>
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="(208) 555-0112"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        <Pressable
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save changes</Text>}
        </Pressable>
      </ScrollView>

      <Modal visible={showGenderPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowGenderPicker(false)}>
          <View style={styles.pickerBox}>
            {GENDERS.map((g) => (
              <Pressable
                key={g}
                style={styles.pickerItem}
                onPress={() => {
                  setGender(g);
                  setShowGenderPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <Modal visible={showCodePicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCodePicker(false)}>
          <View style={styles.pickerBox}>
            {COUNTRY_CODES.map((c) => (
              <Pressable
                key={c}
                style={styles.pickerItem}
                onPress={() => {
                  setCountryCode(c);
                  setShowCodePicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
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
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  headerSpacer: { width: 40 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  avatarWrap: { alignSelf: "center", marginBottom: 28, position: "relative" },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 14, fontWeight: "600" as const, color: Colors.text, marginBottom: 8 },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  inputDisabled: { opacity: 0.9 },
  inputValue: { fontSize: 16, color: Colors.text },
  inputPlaceholder: { fontSize: 16, color: Colors.textTertiary },
  phoneRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minWidth: 72,
  },
  countryCodeText: { fontSize: 16, color: Colors.text, fontWeight: "600" as const },
  phoneInput: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
    minHeight: 52,
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.8 },
  saveBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  pickerBox: { backgroundColor: "#fff", borderRadius: 16, minWidth: 280, maxHeight: 320 },
  pickerItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerItemText: { fontSize: 16, color: Colors.text },
});
