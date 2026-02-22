import React, { useState } from "react";
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
  Image,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { COUNTRY_CODES as ALL_COUNTRY_CODES } from "@/lib/country-codes";

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUserProfile, refreshUser } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [countryCode, setCountryCode] = useState("+1");
  const [gender, setGender] = useState(user?.gender || "");
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

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
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    const fullPhone = (countryCode + " " + phone.trim()).trim();
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Required", "Please enter your phone number.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await updateUserProfile({
        name: name.trim(),
        phone: fullPhone,
        gender: gender || undefined,
      });
      await refreshUser();
      router.replace("/location-prompt");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update profile.");
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
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + rs(16), paddingBottom: insets.bottom + rs(24) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={rs(24)} color={Colors.text} />
        </Pressable>

        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          Don't worry, only you can see your personal data. No one else will be able to see it.
        </Text>

        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} />
            ) : (
              <Ionicons name="person" size={rs(56)} color={Colors.textTertiary} />
            )}
          </View>
          <Pressable style={styles.editAvatarBtn} onPress={pickImage}>
            <Ionicons name="pencil" size={rs(16)} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.form}>
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
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <Pressable
              style={styles.countryCodeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowGenderPicker(false);
                setShowCountryPicker((p) => {
                  if (!p) setCountrySearch("");
                  return !p;
                });
              }}
              disabled={loading}
            >
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={rs(18)} color={Colors.textSecondary} />
            </Pressable>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter Phone Number"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
          {showCountryPicker && (
            <View style={styles.countryPickerWrap}>
              <View style={styles.countrySearchWrap}>
                <Ionicons name="search-outline" size={rs(18)} color={Colors.textTertiary} />
                <TextInput
                  style={styles.countrySearchInput}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  placeholder="Search country..."
                  placeholderTextColor={Colors.textTertiary}
                  autoCorrect={false}
                />
              </View>
              <FlatList
                data={ALL_COUNTRY_CODES.filter(
                  (c) =>
                    !countrySearch.trim() ||
                    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                    c.code.includes(countrySearch)
                )}
                keyExtractor={(item) => item.code + item.name}
                style={styles.countryPickerList}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.countryPickerItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCountryCode(item.code);
                      setCountrySearch("");
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryCodeItemText}>{item.code}</Text>
                    <Text style={styles.countryNameText}>{item.name}</Text>
                  </Pressable>
                )}
              />
            </View>
          )}
          <Text style={styles.label}>Gender</Text>
          <Pressable
            style={styles.input}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCountryPicker(false);
              setShowGenderPicker((p) => !p);
            }}
          >
            <Text style={gender ? styles.inputText : styles.placeholderText}>{gender || "Select"}</Text>
            <Ionicons name="chevron-down" size={rs(20)} color={Colors.textTertiary} />
          </Pressable>
          {showGenderPicker && (
            <View style={styles.genderList}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g}
                  style={styles.genderItem}
                  onPress={() => {
                    setGender(g);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={styles.genderItemText}>{g}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Complete Profile</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: rs(24),
  },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rs(24),
  },
  title: {
    fontSize: rf(26),
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: rs(8),
  },
  subtitle: {
    fontSize: rf(14),
    color: Colors.textSecondary,
    marginBottom: rs(28),
    lineHeight: rf(20),
  },
  avatarWrap: {
    alignSelf: "center",
    marginBottom: rs(28),
    position: "relative",
  },
  avatarCircle: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarBtn: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: Math.max(rs(36), MIN_TOUCH - 4),
    height: Math.max(rs(36), MIN_TOUCH - 4),
    borderRadius: rs(18),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  form: {
    gap: rs(16),
  },
  label: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    fontSize: rf(16),
    color: Colors.text,
  },
  inputText: { fontSize: rf(16), color: Colors.text, flex: 1 },
  placeholderText: { fontSize: rf(16), color: Colors.textTertiary, flex: 1 },
  phoneRow: {
    flexDirection: "row",
    gap: rs(12),
  },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
    backgroundColor: "#F5F5F5",
    borderRadius: rs(12),
    paddingHorizontal: rs(14),
    paddingVertical: rs(14),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: rf(16),
    color: Colors.text,
    fontWeight: "600",
  },
  countryPickerWrap: {
    backgroundColor: "#fff",
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    maxHeight: rs(280),
    marginTop: rs(8),
  },
  countrySearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  countrySearchInput: {
    flex: 1,
    fontSize: rf(15),
    color: Colors.text,
    paddingVertical: rs(6),
  },
  countryPickerList: {
    maxHeight: rs(200),
  },
  countryPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    gap: rs(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  countryCodeItemText: {
    fontSize: rf(15),
    fontWeight: "600",
    color: Colors.text,
    minWidth: rs(48),
  },
  countryNameText: {
    fontSize: rf(15),
    color: Colors.textSecondary,
    flex: 1,
  },
  phoneInput: {
    flex: 1,
  },
  genderList: {
    backgroundColor: "#fff",
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  genderItem: {
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  genderItemText: {
    fontSize: rf(16),
    color: Colors.text,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    alignItems: "center",
    marginTop: rs(12),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
