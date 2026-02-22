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
  ActionSheetIOS,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image as ExpoImage } from "expo-image";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { authFetch, getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/query-client";

export default function AddReviewScreen() {
  const params = useLocalSearchParams<{ hotelId: string; bookingId?: string }>();
  const hotelId = params.hotelId;
  const bookingId = params.bookingId;
  const insets = useSafeAreaInsets();
  const { getHotelById, isAuthenticated, createReview } = useApp();
  const [hotel, setHotel] = useState<{
    id: string;
    name: string;
    location: string;
    city: string;
    country: string;
    rating: number;
    reviewCount: number;
    pricePerNight: number;
    originalPrice: number;
    images: string[];
  } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const MAX_PHOTOS = 5;

  useEffect(() => {
    if (!hotelId) {
      router.back();
      return;
    }
    const cached = getHotelById(hotelId);
    if (cached) {
      setHotel({
        id: cached.id,
        name: cached.name,
        location: cached.location,
        city: cached.city,
        country: cached.country,
        rating: cached.rating,
        reviewCount: cached.reviewCount,
        pricePerNight: cached.pricePerNight,
        originalPrice: cached.originalPrice,
        images: cached.images || [],
      });
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const res = await authFetch(`/api/hotels/${hotelId}`);
        if (res.ok) {
          const data = await res.json();
          setHotel({
            id: data.id,
            name: data.name,
            location: data.location,
            city: data.city,
            country: data.country,
            rating: Number(data.rating ?? 0),
            reviewCount: Number(data.reviewCount ?? data.review_count ?? 0),
            pricePerNight: Number(data.pricePerNight ?? data.price_per_night ?? 0),
            originalPrice: Number(data.originalPrice ?? data.original_price ?? data.pricePerNight ?? 0),
            images: Array.isArray(data.images) ? data.images : [],
          });
        }
      } catch {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [hotelId, getHotelById]);

  const uploadImage = async (uri: string): Promise<string> => {
    const token = await getToken();
    const baseUrl = getApiUrl();
    const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    const formData = new FormData();
    formData.append("file", { uri, type: mime, name: `review-${Date.now()}.${ext}` } as any);
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
    return url.startsWith("http") ? url : `${baseUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const pickFromDevice = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Add Photo", "Photo upload is best experienced on the mobile app.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to add images to your review.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        const url = await uploadImage(result.assets[0].uri);
        setPhotoUris((prev) => (prev.length < MAX_PHOTOS ? [...prev, url] : prev));
      } catch (e) {
        Alert.alert("Upload failed", (e as Error)?.message || "Could not add photo.");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Add Photo", "Camera is best experienced on the mobile app.");
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to the camera to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        const url = await uploadImage(result.assets[0].uri);
        setPhotoUris((prev) => (prev.length < MAX_PHOTOS ? [...prev, url] : prev));
      } catch (e) {
        Alert.alert("Upload failed", (e as Error)?.message || "Could not add photo.");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleAddPhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (photoUris.length >= MAX_PHOTOS) {
      Alert.alert("Limit reached", `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    if (uploadingPhoto) return;
    if (Platform.OS === "ios" && typeof ActionSheetIOS !== "undefined" && ActionSheetIOS.showActionSheetWithOptions) {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Choose from gallery", "Take photo"], cancelButtonIndex: 0, title: "Add photo to review" },
        (i) => { if (i === 1) pickFromDevice(); else if (i === 2) takePhoto(); }
      );
    } else {
      Alert.alert("Add photo to review", "Choose a source", [
        { text: "Cancel", style: "cancel" },
        { text: "Choose from gallery", onPress: pickFromDevice },
        { text: "Take photo", onPress: takePhoto },
      ]);
    }
  };

  const removePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!hotelId || !hotel) return;
    if (rating < 1) {
      Alert.alert("Rating required", "Please select your overall rating.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      Alert.alert("Review required", "Please add a detailed review (at least 5 characters).");
      return;
    }
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await createReview({ hotelId, rating, comment: comment.trim(), bookingId, images: photoUris.length > 0 ? photoUris : undefined });
      Alert.alert("Thank you", "Your review has been submitted.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hotelId) return null;
  if (!hotel && loading) {
    return (
      <View style={[styles.centered, { paddingTop: rs(100) }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (!hotel && !loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Hotel not found</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.backLink}>Go back</Text></Pressable>
      </View>
    );
  }

  const heroImage = hotel?.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";
  const fullAddress = hotel ? [hotel.location, hotel.city, hotel.country].filter(Boolean).join(", ") : "";
  const discountPercent = hotel && hotel.originalPrice > hotel.pricePerNight
    ? Math.round(((hotel.originalPrice - hotel.pricePerNight) / hotel.originalPrice) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={topInset}
      >
        <View style={styles.heroWrap}>
          <ExpoImage source={{ uri: heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.heroBlur} />
          <Pressable style={[styles.backBtn, { top: topInset + rs(8) }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={rs(24)} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + rs(24) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              {discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercent}% Off</Text>
                </View>
              )}
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={rs(14)} color={Colors.star} />
                <Text style={styles.ratingText}>{hotel?.rating.toFixed(1) ?? "0"} ({hotel?.reviewCount ?? 0} reviews)</Text>
              </View>
            </View>
            <Text style={styles.hotelName}>{hotel?.name ?? ""}</Text>
            <Text style={styles.address}>{fullAddress}</Text>
            <View style={styles.divider} />

            <Text style={styles.label}>Your rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRating(star);
                  }}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={rs(36)}
                    color={Colors.star}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: rs(24) }]}>Add detailed review</Text>
            <TextInput
              style={styles.textArea}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience – what did you like? Any tips for other guests?"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!submitting}
            />

            <Text style={[styles.label, { marginTop: rs(20) }]}>Add photos (optional)</Text>
            <Text style={styles.hint}>Add up to {MAX_PHOTOS} photos to make your review stand out.</Text>
            <View style={styles.photoSection}>
              {photoUris.map((uri, index) => (
                <View key={uri} style={styles.photoThumbWrap}>
                  <ExpoImage source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                  <Pressable style={styles.removePhotoBtn} onPress={() => removePhoto(index)} hitSlop={8}>
                    <Ionicons name="close-circle" size={rs(24)} color="#E53935" />
                  </Pressable>
                </View>
              ))}
              {photoUris.length < MAX_PHOTOS && (
                <Pressable
                  style={[styles.addPhotoBtn, uploadingPhoto && styles.addPhotoBtnDisabled]}
                  onPress={handleAddPhoto}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={rs(28)} color={Colors.primary} />
                      <Text style={styles.addPhotoText}>Add photo</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            <Pressable
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboard: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: rs(24) },
  errorText: { fontSize: rf(16), color: Colors.textSecondary, marginBottom: rs(12) },
  backLink: { fontSize: rf(16), fontWeight: "600", color: Colors.primary, minHeight: MIN_TOUCH, justifyContent: "center" },
  heroWrap: {
    height: rs(220),
    position: "relative",
  },
  heroBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  backBtn: {
    position: "absolute",
    left: rs(16),
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: rs(20), paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: rs(20),
    marginTop: -rs(32),
    padding: rs(24),
    paddingTop: rs(28),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rs(8),
  },
  discountBadge: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(8),
  },
  discountText: {
    fontSize: rf(13),
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: rs(4) },
  ratingText: { fontSize: rf(13), color: Colors.textSecondary, fontWeight: "600" as const },
  hotelName: {
    fontSize: rf(22),
    fontWeight: "800" as const,
    color: Colors.text,
    marginBottom: rs(4),
  },
  address: { fontSize: rf(14), color: Colors.textSecondary, marginBottom: rs(16) },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginBottom: rs(20) },
  label: {
    fontSize: rf(15),
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: rs(10),
  },
  starRow: { flexDirection: "row", gap: rs(12), marginBottom: rs(4) },
  starBtn: { padding: rs(6), minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  textArea: {
    backgroundColor: "#F8F9FA",
    borderRadius: rs(14),
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    fontSize: rf(16),
    color: Colors.text,
    minHeight: rs(140),
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  hint: {
    fontSize: rf(13),
    color: Colors.textSecondary,
    marginBottom: rs(12),
  },
  photoSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(12),
  },
  photoThumbWrap: {
    position: "relative",
    width: rs(80),
    height: rs(80),
    borderRadius: rs(12),
    overflow: "hidden",
  },
  photoThumb: {
    width: "100%",
    height: "100%",
  },
  removePhotoBtn: {
    position: "absolute",
    top: rs(4),
    right: rs(4),
  },
  addPhotoBtn: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(12),
    borderWidth: 2,
    borderColor: Colors.primary + "60",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(4),
  },
  addPhotoBtnDisabled: {
    opacity: 0.7,
  },
  addPhotoText: {
    fontSize: rf(12),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: rs(18),
    borderRadius: rs(14),
    alignItems: "center",
    marginTop: rs(32),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: "#fff",
  },
});
