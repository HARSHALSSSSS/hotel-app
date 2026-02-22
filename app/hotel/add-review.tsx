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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { authFetch } from "@/lib/auth";

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

  const topInset = Platform.OS === "web" ? 67 : insets.top;

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
      await createReview({ hotelId, rating, comment: comment.trim(), bookingId });
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

            <Text style={styles.label}>Your overall rating of this product</Text>
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
              placeholder="Enter here"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!submitting}
            />

            <Pressable style={styles.addPhotoRow} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="camera-outline" size={rs(20)} color={Colors.primary} />
              <Text style={styles.addPhotoText}>add photo</Text>
            </Pressable>

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
    borderRadius: rs(24),
    marginTop: -rs(24),
    padding: rs(20),
    paddingTop: rs(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
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
  starRow: { flexDirection: "row", gap: rs(8), marginBottom: rs(8) },
  starBtn: { padding: rs(4), minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  textArea: {
    backgroundColor: "#F5F5F5",
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(14),
    fontSize: rf(16),
    color: Colors.text,
    minHeight: rs(120),
    textAlignVertical: "top",
  },
  addPhotoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    marginTop: rs(16),
    minHeight: MIN_TOUCH,
    justifyContent: "center",
  },
  addPhotoText: {
    fontSize: rf(15),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: rs(16),
    borderRadius: rs(14),
    alignItems: "center",
    marginTop: rs(28),
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
