import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
  ActionSheetIOS,
  useWindowDimensions,
  Share,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";
import { authFetch, getToken } from "@/lib/auth";
import { Room, Review } from "@/lib/hotel-data";
import HotelImageCarousel from "@/components/HotelImageCarousel";
import { HotelImage } from "@/components/HotelImage";
import { getOptimizedImageUrl, isValidImageUrl } from "@/lib/image-utils";
import { getApiUrl } from "@/lib/query-client";

// Gallery fallback – 6 distinct hotel images (Unsplash)
const DEFAULT_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  "https://images.unsplash.com/photo-1559827260-dc66d43bef33?w=800&q=80",
];

type HotelDetail = {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  description: string;
  pricePerNight: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  latitude: number;
  longitude: number;
  category: string;
  featured: boolean;
  rooms: Room[];
  reviews: Review[];
};


function AmenityChip({ name }: { name: string }) {
  const iconMap: Record<string, string> = {
    "Pool": "water-outline",
    "Spa": "leaf-outline",
    "Restaurant": "restaurant-outline",
    "Gym": "barbell-outline",
    "Beach Access": "umbrella-outline",
    "Room Service": "bed-outline",
    "Concierge": "people-outline",
    "Valet Parking": "car-outline",
    "Business Center": "briefcase-outline",
    "Bar": "wine-outline",
    "Laundry": "shirt-outline",
    "Wi-Fi": "wifi-outline",
    "Private Beach": "umbrella-outline",
    "Diving Center": "fish-outline",
    "Water Sports": "boat-outline",
    "Overwater Bungalow": "home-outline",
    "Sunset Cruise": "boat-outline",
    "Infinity Pool": "water-outline",
    "Helipad": "airplane-outline",
    "Butler Service": "person-outline",
    "Shopping Arcade": "bag-outline",
    "Rooftop Terrace": "sunny-outline",
    "Wine Cellar": "wine-outline",
    "Rooftop Bar": "wine-outline",
    "Ski Access": "snow-outline",
    "Fireplace": "flame-outline",
    "Heated Pool": "water-outline",
    "Mountain Guide": "trail-sign-outline",
    "Kids Club": "happy-outline",
    "Yoga Studio": "body-outline",
    "Cenote Access": "water-outline",
    "Eco Tours": "leaf-outline",
    "Yacht Charter": "boat-outline",
  };

  return (
    <View style={styles.amenityChip}>
      <Ionicons name={(iconMap[name] || "ellipse-outline") as any} size={rs(16)} color={Colors.primary} />
      <Text style={styles.amenityText}>{name}</Text>
    </View>
  );
}

function getTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const months = Math.floor((now.getTime() - d.getTime()) / (30 * 24 * 60 * 60 * 1000));
  if (months >= 12) return `${Math.floor(months / 12)} year${months >= 24 ? "s" : ""} ago`;
  if (months >= 1) return `${months} month${months > 1 ? "s" : ""} ago`;
  const days = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} ago`;
  return "Today";
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={[styles.reviewAvatar, { backgroundColor: review.avatar }]}>
          <Text style={styles.reviewAvatarText}>{review.userName.charAt(0)}</Text>
        </View>
        <View style={styles.reviewInfo}>
          <View style={styles.reviewNameRow}>
            <Text style={styles.reviewName}>{review.userName}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.reviewDate}>{getTimeAgo(review.date)}</Text>
        </View>
        <View style={styles.reviewRating}>
          <Ionicons name="star" size={12} color={Colors.star} />
          <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
      {review.images && review.images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImages} contentContainerStyle={styles.reviewImagesContent}>
          {review.images.map((imgUri, i) => (
            <Image key={i} source={{ uri: imgUri }} style={styles.reviewImage} contentFit="cover" />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function RoomCard({ room, onSelect }: { room: Room; onSelect: () => void }) {
  return (
    <View style={styles.roomCard}>
      <HotelImage
        uri={room.image}
        size="card"
        style={styles.roomImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.roomDesc} numberOfLines={2}>{room.description}</Text>
        <View style={styles.roomMeta}>
          <View style={styles.roomMetaItem}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.roomMetaText}>{room.maxGuests} guests</Text>
          </View>
          <View style={styles.roomMetaItem}>
            <Ionicons name="bed-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.roomMetaText}>{room.bedType}</Text>
          </View>
          <View style={styles.roomMetaItem}>
            <Ionicons name="resize-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.roomMetaText}>{room.size}m²</Text>
          </View>
        </View>
        <View style={styles.roomBottom}>
          <Text style={styles.roomPrice}>
            ₹{room.pricePerNight.toLocaleString("en-IN")}<Text style={styles.roomPriceUnit}>/night</Text>
          </Text>
          <Pressable
            style={[styles.selectBtn, !room.available && styles.selectBtnDisabled]}
            onPress={room.available ? onSelect : undefined}
          >
            <Text style={[styles.selectBtnText, !room.available && styles.selectBtnTextDisabled]}>
              {room.available ? "Select" : "Sold Out"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function mapApiHotelToDetail(api: any): HotelDetail {
  const reviews: Review[] = (api.reviews || []).map((r: any) => ({
    id: r.id,
    userName: r.userName ?? r.user_name ?? "Guest",
    rating: Number(r.rating),
    comment: r.comment ?? "",
    date: r.createdAt ?? r.created_at ?? new Date().toISOString(),
    avatar: (typeof r.userAvatar === "string" && r.userAvatar) || (r.user_avatar) || "#1B4B66",
    images: Array.isArray(r.images) ? r.images : (r.images && typeof r.images === "string" ? (() => { try { return JSON.parse(r.images); } catch { return []; } })() : []),
  }));
  const rooms: Room[] = (api.rooms || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    pricePerNight: Number(r.pricePerNight ?? r.price_per_night ?? 0),
    maxGuests: Number(r.maxGuests ?? r.max_guests ?? 2),
    bedType: r.bedType ?? r.bed_type ?? "Queen",
    size: Number(r.size ?? 0),
    amenities: Array.isArray(r.amenities) ? r.amenities : [],
    image: r.image ?? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    available: r.available !== false,
  }));
  return {
    id: api.id,
    name: api.name,
    location: api.location,
    city: api.city,
    country: api.country,
    description: api.description ?? "",
    pricePerNight: Number(api.pricePerNight ?? api.price_per_night ?? 0),
    originalPrice: Number(api.originalPrice ?? api.original_price ?? api.pricePerNight ?? api.price_per_night ?? 0),
    rating: Number(api.rating ?? 0),
    reviewCount: Number(api.reviewCount ?? api.review_count ?? reviews.length),
    images: (() => {
      let arr = api.images;
      if (typeof arr === "string") {
        try {
          arr = JSON.parse(arr);
        } catch {
          arr = [];
        }
      }
      if (Array.isArray(arr) && arr.length > 0) {
        const urls = arr
          .map((x) => (typeof x === "string" ? x : x && typeof x === "object" && "url" in x ? (x as any).url : null))
          .filter((u): u is string => typeof u === "string" && u.trim().length > 0 && isValidImageUrl(u));
        if (urls.length > 0) return urls;
      }
      return DEFAULT_GALLERY_IMAGES;
    })(),
    amenities: Array.isArray(api.amenities) ? api.amenities : [],
    latitude: Number(api.latitude ?? 0),
    longitude: Number(api.longitude ?? 0),
    category: api.category ?? "luxury",
    featured: Boolean(api.featured),
    rooms,
    reviews,
  };
}

const CONTENT_PADDING = 40;
const GALLERY_GAP = 12;
const GALLERY_COLUMNS = 2;

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { getHotelById, isFavorite, toggleFavorite, isAuthenticated } = useApp();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "gallery" | "review">("about");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"all" | "verified" | "latest" | "photos">("latest");
  const [userGalleryImages, setUserGalleryImages] = useState<string[]>([]);
  const [addPhotoLoading, setAddPhotoLoading] = useState(false);

  useEffect(() => {
    if (!hotel?.images?.length) return;
    Image.prefetch(hotel.images.slice(0, 5), "memory-disk").catch(() => {});
  }, [hotel?.id, hotel?.images?.length]);

  useEffect(() => {
    if (!id) return;
    const cached = getHotelById(id);
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`/api/hotels/${id}`);
        if (res.ok) {
          const data = await res.json();
          let detail = mapApiHotelToDetail(data);
          if (!detail.rooms || detail.rooms.length === 0) {
            try {
              const roomsRes = await authFetch(`/api/hotels/${id}/rooms`);
              if (roomsRes.ok) {
                const roomsData = await roomsRes.json();
                const mapped = (roomsData || []).map((r: any) => ({
                  id: r.id,
                  name: r.name,
                  description: r.description ?? "",
                  pricePerNight: Number(r.pricePerNight ?? r.price_per_night ?? 0),
                  maxGuests: Number(r.maxGuests ?? r.max_guests ?? 2),
                  bedType: r.bedType ?? r.bed_type ?? "Queen",
                  size: Number(r.size ?? 0),
                  amenities: Array.isArray(r.amenities) ? r.amenities : [],
                  image: r.image ?? "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
                  available: r.available !== false,
                }));
                if (mapped.length > 0) detail = { ...detail, rooms: mapped };
              }
            } catch {}
          }
          setHotel(detail);
        } else if (cached) {
          setHotel({
            ...cached,
            rooms: [],
            reviews: [],
          });
        } else {
          setError("Hotel not found");
        }
      } catch (e) {
        if (cached) {
          setHotel({ ...cached, rooms: [], reviews: [] });
        } else {
          setError("Failed to load hotel");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getHotelById]);

  const saved = hotel ? isFavorite(hotel.id) : false;
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  if (loading && !hotel) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (error && !hotel) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: Colors.primary }}>Go back</Text>
        </Pressable>
      </View>
    );
  }
  if (!hotel) return null;

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(hotel.id);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const location = [hotel.city, hotel.country].filter(Boolean).join(", ") || hotel.location;
    const message = `Check out ${hotel.name}${location ? ` in ${location}` : ""}! ₹${hotel.pricePerNight.toLocaleString("en-IN")} per night.`;
    const url = Platform.OS === "web" ? `${getApiUrl()}/hotel/${hotel.id}` : `myapp://hotel/${hotel.id}`;
    const fullText = `${message}\n${url}`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: hotel.name, text: message, url });
      } else if (Share?.share) {
        await Share.share({
          message: fullText,
          title: hotel.name,
          url: Platform.OS === "ios" ? url : undefined,
        });
      } else if (Platform.OS === "web" && typeof navigator?.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(fullText);
        Alert.alert("Copied", "Hotel link copied to clipboard.");
      } else {
        Alert.alert("Share", "Sharing is not supported on this device.");
      }
    } catch (e: any) {
      if (e?.message !== "User did not share") Alert.alert("Share", (e as Error)?.message || "Could not share.");
    }
  };

  const handleSelectRoom = (room: Room) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const hotelAddress = [hotel.location, hotel.city, hotel.country].filter(Boolean).join(", ");
    router.push({
      pathname: "/booking",
      params: {
        hotelId: hotel.id,
        roomId: room.id,
        roomName: room.name,
        roomPrice: room.pricePerNight.toString(),
        hotelName: hotel.name,
        hotelImage: hotel.images[0],
        originalPrice: hotel.originalPrice?.toString() ?? "",
        hotelAddress: hotelAddress || undefined,
      },
    });
  };

  const uploadAndAddPhoto = async (uri: string) => {
    setAddPhotoLoading(true);
    try {
      const token = await getToken();
      const baseUrl = getApiUrl();
      const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      const formData = new FormData();
      formData.append("file", { uri, type: mime, name: `gallery-${Date.now()}.${ext}` } as any);
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
      setUserGalleryImages((prev) => [...prev, fullUrl]);
    } catch (e) {
      Alert.alert("Add Photo", (e as Error)?.message || "Could not add photo. Please try again.");
    } finally {
      setAddPhotoLoading(false);
    }
  };

  const pickFromDevice = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to add images to the gallery.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAndAddPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
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
      await uploadAndAddPhoto(result.assets[0].uri);
    }
  };

  const handleAddPhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (addPhotoLoading) return;
    if (Platform.OS === "ios" && typeof ActionSheetIOS !== "undefined" && ActionSheetIOS.showActionSheetWithOptions) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Add from device", "Take photo"],
          cancelButtonIndex: 0,
          title: "Add photo to gallery",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickFromDevice();
          else if (buttonIndex === 2) takePhoto();
        }
      );
    } else {
      Alert.alert("Add photo to gallery", "Choose a source", [
        { text: "Cancel", style: "cancel" },
        { text: "Add from device", onPress: pickFromDevice },
        { text: "Take photo", onPress: takePhoto },
      ]);
    }
  };

  const discountPercent = hotel.originalPrice > hotel.pricePerNight
    ? Math.round(((hotel.originalPrice - hotel.pricePerNight) / hotel.originalPrice) * 100)
    : 0;
  const totalBeds = (hotel.rooms || []).reduce((s, r) => s + (r.maxGuests || 2), 0);
  const totalSqft = (hotel.rooms || []).length
    ? Math.round((hotel.rooms || []).reduce((s, r) => s + (r.size || 0), 0) * 10.764)
    : 1848;
  const baths = Math.max(1, (hotel.rooms || []).length);
  const allReviews = hotel.reviews || [];
  const sortedReviews = [...allReviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredBySearch = reviewSearch.trim()
    ? sortedReviews.filter((r) => r.comment.toLowerCase().includes(reviewSearch.toLowerCase()) || r.userName.toLowerCase().includes(reviewSearch.toLowerCase()))
    : sortedReviews;
  const visibleReviews = reviewFilter === "latest" ? filteredBySearch : filteredBySearch;
  const fullAddress = [hotel.location, hotel.city, hotel.country].filter(Boolean).join(", ");
  const descLineCount = descriptionExpanded ? undefined : 4;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.galleryContainer}>
          <HotelImageCarousel images={hotel.images.length ? hotel.images : DEFAULT_GALLERY_IMAGES} height={rs(320)} />
          <View style={[styles.galleryOverlay, { top: topInset + 8 }]}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </Pressable>
            <View style={styles.galleryActions}>
              <Pressable style={styles.actionBtn} onPress={handleFavorite}>
                <Ionicons name={saved ? "heart" : "heart-outline"} size={20} color={saved ? Colors.error : Colors.text} />
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={Colors.text} />
              </Pressable>
            </View>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.content}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewTopRow}>
              {discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercent}% Off</Text>
                </View>
              )}
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color={Colors.star} />
                <Text style={styles.ratingBadgeText}>{hotel.rating.toFixed(1)} ({hotel.reviewCount} reviews)</Text>
              </View>
            </View>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1}>{fullAddress}</Text>
              {(hotel.latitude !== 0 || hotel.longitude !== 0) && (
                <Pressable
                  style={styles.mapBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: "/hotel/location",
                      params: {
                        hotelId: hotel.id,
                        hotelName: hotel.name,
                        latitude: String(hotel.latitude),
                        longitude: String(hotel.longitude),
                        address: fullAddress || undefined,
                      },
                    });
                  }}
                >
                  <Ionicons name="location" size={18} color="#fff" />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.tabs}>
            <Pressable style={styles.tab} onPress={() => setActiveTab("about")}>
              <Text style={[styles.tabText, activeTab === "about" && styles.tabTextActive]}>About</Text>
              {activeTab === "about" && <View style={styles.tabUnderline} />}
            </Pressable>
            <Pressable style={styles.tab} onPress={() => setActiveTab("gallery")}>
              <Text style={[styles.tabText, activeTab === "gallery" && styles.tabTextActive]}>Gallery</Text>
              {activeTab === "gallery" && <View style={styles.tabUnderline} />}
            </Pressable>
            <Pressable style={styles.tab} onPress={() => setActiveTab("review")}>
              <Text style={[styles.tabText, activeTab === "review" && styles.tabTextActive]}>Review</Text>
              {activeTab === "review" && <View style={styles.tabUnderline} />}
            </Pressable>
          </View>

          {activeTab === "about" && (
            <View style={styles.tabContent}>
              <View style={styles.roomSpecs}>
                <View style={styles.specItem}>
                  <Ionicons name="bed-outline" size={20} color={Colors.primary} />
                  <Text style={styles.specText}>{Math.max(1, totalBeds)} Beds</Text>
                </View>
                <View style={styles.specItem}>
                  <Ionicons name="water-outline" size={20} color={Colors.primary} />
                  <Text style={styles.specText}>{baths} Bath</Text>
                </View>
                <View style={styles.specItem}>
                  <Ionicons name="square-outline" size={20} color={Colors.primary} />
                  <Text style={styles.specText}>{totalSqft.toLocaleString()} sqft</Text>
                </View>
              </View>
              <Text style={styles.aboutLabel}>Description</Text>
              <Text style={styles.description} numberOfLines={descLineCount}>{hotel.description}</Text>
              <Pressable onPress={() => setDescriptionExpanded((e) => !e)}>
                <Text style={styles.readMore}>Read more</Text>
              </Pressable>
              <Text style={[styles.aboutLabel, { marginTop: 20 }]}>Contact Details</Text>
              <View style={styles.contactRow}>
                <View style={[styles.reviewAvatar, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.reviewAvatarText}>{(hotel.name || "H").charAt(0)}</Text>
                </View>
                <Text style={styles.contactName}>{hotel.name} Support</Text>
                <View style={styles.contactIcons}>
                  <Pressable
                    style={[styles.contactIconBtnPrimary, chatLoading && styles.contactIconBtnDisabled]}
                    disabled={chatLoading}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (!isAuthenticated) {
                        Alert.alert("Sign in to chat", "Please sign in to start a chat with our support team.", [
                          { text: "Cancel", style: "cancel" },
                          { text: "Sign In", onPress: () => router.push("/auth/login") },
                        ]);
                        return;
                      }
                      setChatLoading(true);
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
                          pathname: "/(tabs)/chat/[id]" as const,
                          params: { id: convo.id, otherName, otherAvatar },
                        });
                      } catch (e: any) {
                        Alert.alert("Chat error", e?.message || "Could not open chat. Please check your connection and try again.");
                      } finally {
                        setChatLoading(false);
                      }
                    }}
                  >
                    {chatLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.contactIconBtnPrimary}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: "/call",
                        params: { hotelId: hotel.id, hotelName: hotel.name, voiceOnly: "1" },
                      });
                    }}
                  >
                    <Ionicons name="call" size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {activeTab === "gallery" && (
            <View style={styles.tabContent}>
              <View style={styles.galleryHeader}>
                <Text style={styles.galleryTitle}>
                  Gallery {(() => {
                    const base = Array.isArray(hotel.images) && hotel.images.length > 0 ? hotel.images : DEFAULT_GALLERY_IMAGES;
                    const total = base.length + userGalleryImages.length;
                    return `(${total})`;
                  })()}
                </Text>
                {isAuthenticated && (
                  <Pressable
                    style={[styles.addPhotoRow, addPhotoLoading && styles.addPhotoRowDisabled]}
                    onPress={handleAddPhoto}
                    disabled={addPhotoLoading}
                  >
                    {addPhotoLoading ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                    )}
                    <Text style={[styles.addPhotoLink, addPhotoLoading && styles.addPhotoLinkDisabled]}>
                      {addPhotoLoading ? "Adding…" : "add photo"}
                    </Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.galleryGrid}>
                {(() => {
                  const base = Array.isArray(hotel.images) && hotel.images.length > 0 ? hotel.images : DEFAULT_GALLERY_IMAGES;
                  const galleryImages = [...base, ...userGalleryImages].filter((u): u is string => typeof u === "string" && u.length > 0);
                  const imagesToShow = galleryImages.length > 0 ? galleryImages : DEFAULT_GALLERY_IMAGES;
                  const itemSize = Math.max(120, (windowWidth - CONTENT_PADDING - GALLERY_GAP) / GALLERY_COLUMNS);
                  return imagesToShow.slice(0, 12).map((uri, i) => (
                    <View key={`gallery-${i}-${String(uri).slice(-30)}`} style={[styles.galleryGridItem, { width: itemSize, height: itemSize }]}>
                      <HotelImage
                        uri={uri}
                        size="card"
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                        priority={i < 4 ? "high" : "normal"}
                        recyclingKey={`gallery-${hotel.id}-${i}`}
                        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                      />
                    </View>
                  ));
                })()}
              </View>
            </View>
          )}

          {activeTab === "review" && (
            <View style={styles.tabContent}>
              <View style={styles.reviewTabHeader}>
                <Text style={styles.reviewTabTitle}>Reviews</Text>
                {isAuthenticated && (
                  <Pressable
                    style={styles.addReviewRow}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: "/hotel/add-review", params: { hotelId: hotel.id } });
                    }}
                  >
                    <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
                    <Text style={styles.addReviewLink}>add review</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color={Colors.textTertiary} />
                <TextInput
                  style={styles.reviewSearchInput}
                  value={reviewSearch}
                  onChangeText={setReviewSearch}
                  placeholder="Search in reviews"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <Pressable style={[styles.chip, reviewFilter === "all" && styles.chipActive]} onPress={() => setReviewFilter("all")}>
                  <Ionicons name="options-outline" size={14} color={Colors.textSecondary} />
                  <Text style={[styles.chipText, reviewFilter === "all" && styles.chipTextActive]}>Filter</Text>
                </Pressable>
                <Pressable style={[styles.chip, reviewFilter === "verified" && styles.chipActive]} onPress={() => setReviewFilter("verified")}>
                  <Text style={[styles.chipText, reviewFilter === "verified" && styles.chipTextActive]}>Verified</Text>
                </Pressable>
                <Pressable style={[styles.chip, reviewFilter === "latest" && styles.chipActive]} onPress={() => setReviewFilter("latest")}>
                  <Text style={[styles.chipText, reviewFilter === "latest" && styles.chipTextActive]}>Latest</Text>
                </Pressable>
                <Pressable style={[styles.chip, reviewFilter === "photos" && styles.chipActive]} onPress={() => setReviewFilter("photos")}>
                  <Text style={[styles.chipText, reviewFilter === "photos" && styles.chipTextActive]}>With Photos</Text>
                </Pressable>
              </ScrollView>
              {visibleReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          )}

          <View style={{ height: rs(120) + bottomInset }} />
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 8 }]}>
        <View>
          <Text style={styles.totalPriceLabel}>Total Price</Text>
          <View style={styles.bottomPriceRow}>
            <Text style={styles.bottomPrice}>₹{hotel.pricePerNight.toLocaleString("en-IN")}</Text>
            <Text style={styles.bottomPriceUnit}>/night</Text>
          </View>
        </View>
        <Pressable
          style={styles.bookNowBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const availableRoom = hotel.rooms?.find((r) => r.available) ?? hotel.rooms?.[0];
            if (availableRoom) {
              handleSelectRoom(availableRoom);
            } else {
              Alert.alert("No rooms", "There are no rooms available for this hotel.");
            }
          }}
        >
          <Text style={styles.bookNowText}>Book Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: rf(16),
    color: Colors.textSecondary,
    marginBottom: rs(12),
  },
  galleryContainer: {
    position: "relative",
  },
  galleryOverlay: {
    position: "absolute",
    left: rs(16),
    right: rs(16),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryActions: {
    flexDirection: "row",
    gap: rs(8),
  },
  actionBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: rs(20),
    backgroundColor: "#fff",
    borderTopLeftRadius: rs(20),
    borderTopRightRadius: rs(20),
    marginTop: -rs(20),
    paddingTop: rs(20),
  },
  overviewCard: {
    marginBottom: rs(20),
  },
  overviewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rs(8),
  },
  discountBadge: {
    backgroundColor: Colors.primary + "18",
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(8),
  },
  discountText: {
    fontSize: rf(13),
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
  },
  ratingBadgeText: {
    fontSize: rf(13),
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  hotelName: {
    fontSize: rf(24),
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: rs(6),
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
  },
  addressText: {
    flex: 1,
    fontSize: rf(14),
    color: Colors.textSecondary,
  },
  mapBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: rs(16),
  },
  tab: {
    flex: 1,
    paddingVertical: rs(12),
    alignItems: "center",
    position: "relative",
    minHeight: MIN_TOUCH,
  },
  tabText: {
    fontSize: rf(15),
    fontWeight: "600" as const,
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    left: rs(16),
    right: rs(16),
    height: rs(2),
    backgroundColor: Colors.primary,
    borderRadius: rs(1),
  },
  tabContent: {
    minHeight: rs(200),
  },
  roomSpecs: {
    flexDirection: "row",
    gap: rs(24),
    marginBottom: rs(20),
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
  },
  specText: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  aboutLabel: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: rs(8),
  },
  readMore: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
    marginTop: rs(4),
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(12),
    marginTop: rs(8),
  },
  contactName: {
    flex: 1,
    fontSize: rf(15),
    fontWeight: "600" as const,
    color: Colors.text,
  },
  contactIcons: {
    flexDirection: "row",
    gap: rs(10),
  },
  contactIconBtn: {
    width: Math.max(rs(40), MIN_TOUCH),
    height: Math.max(rs(40), MIN_TOUCH),
    borderRadius: rs(20),
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  contactIconBtnPrimary: {
    width: Math.max(rs(44), MIN_TOUCH),
    height: Math.max(rs(44), MIN_TOUCH),
    borderRadius: rs(22),
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  contactIconBtnDisabled: {
    opacity: 0.7,
  },
  galleryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rs(16),
  },
  galleryTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  addPhotoRow: { flexDirection: "row", alignItems: "center", gap: rs(6), minHeight: MIN_TOUCH, justifyContent: "center" },
  addPhotoRowDisabled: { opacity: 0.7 },
  addPhotoLink: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  addPhotoLinkDisabled: {
    color: Colors.textSecondary,
  },
  addReviewRow: { flexDirection: "row", alignItems: "center", gap: rs(6) },
  addReviewLink: {
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(12),
  },
  galleryGridItem: {
    borderRadius: rs(12),
    overflow: "hidden",
    backgroundColor: Colors.surfaceElevated,
  },
  reviewTabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: rs(12),
  },
  reviewTabTitle: {
    fontSize: rf(18),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: rs(12),
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    marginBottom: rs(12),
    gap: rs(8),
  },
  reviewSearchInput: {
    flex: 1,
    fontSize: rf(15),
    color: Colors.text,
    padding: 0,
  },
  chipScroll: {
    marginBottom: rs(16),
    marginHorizontal: -rs(20),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    paddingHorizontal: rs(14),
    paddingVertical: rs(8),
    borderRadius: rs(20),
    backgroundColor: Colors.surfaceElevated,
    marginLeft: rs(20),
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: rf(13),
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: "#fff",
  },
  reviewNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
  },
  verifiedBadge: {},
  totalPriceLabel: {
    fontSize: rf(12),
    color: Colors.textSecondary,
    marginBottom: rs(2),
  },
  titleSection: {
    paddingTop: rs(20),
    gap: rs(6),
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: Colors.accent + "20",
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(8),
  },
  categoryText: {
    fontSize: rf(12),
    fontWeight: "600" as const,
    color: Colors.accentDark,
  },
  hotelName: {
    fontSize: rf(26),
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
  },
  locationText: {
    fontSize: rf(14),
    color: Colors.textSecondary,
  },
  viewOnMapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    marginTop: rs(8),
    paddingVertical: rs(10),
    paddingHorizontal: rs(12),
    backgroundColor: Colors.primary + "10",
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: Colors.primary + "25",
  },
  viewOnMapText: {
    flex: 1,
    fontSize: rf(14),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
  },
  ratingStars: {
    flexDirection: "row",
    gap: rs(2),
  },
  ratingValue: {
    fontSize: rf(15),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  reviewCountText: {
    fontSize: rf(13),
    color: Colors.textSecondary,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: rs(16),
    padding: rs(16),
    backgroundColor: Colors.primary + "08",
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: Colors.primary + "15",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currentPrice: {
    fontSize: rf(28),
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  priceNight: {
    fontSize: rf(14),
    color: Colors.textSecondary,
  },
  originalPriceText: {
    fontSize: rf(14),
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
  },
  saveBadge: {
    backgroundColor: Colors.success + "15",
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(10),
  },
  saveText: {
    fontSize: rf(13),
    fontWeight: "700" as const,
    color: Colors.success,
  },
  section: {
    marginTop: rs(28),
  },
  sectionTitle: {
    fontSize: rf(19),
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: rs(12),
  },
  description: {
    fontSize: rf(14),
    lineHeight: rf(22),
    color: Colors.textSecondary,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(8),
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    borderRadius: rs(10),
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  amenityText: {
    fontSize: rf(13),
    color: Colors.text,
  },
  roomCard: {
    backgroundColor: Colors.card,
    borderRadius: rs(16),
    overflow: "hidden",
    marginBottom: rs(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: rs(8),
    elevation: 2,
  },
  roomImage: {
    width: "100%",
    height: rs(150),
  },
  roomInfo: {
    padding: rs(14),
    gap: rs(6),
  },
  roomName: {
    fontSize: rf(17),
    fontWeight: "700" as const,
    color: Colors.text,
  },
  roomDesc: {
    fontSize: rf(13),
    color: Colors.textSecondary,
    lineHeight: rf(18),
  },
  roomMeta: {
    flexDirection: "row",
    gap: rs(14),
    marginTop: rs(4),
  },
  roomMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(4),
  },
  roomMetaText: {
    fontSize: rf(12),
    color: Colors.textSecondary,
  },
  roomBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: rs(8),
  },
  roomPrice: {
    fontSize: rf(20),
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  roomPriceUnit: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: Colors.textSecondary,
  },
  selectBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  selectBtnDisabled: {
    backgroundColor: Colors.border,
  },
  selectBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
  selectBtnTextDisabled: {
    color: Colors.textTertiary,
  },
  reviewSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllBtn: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reviewRatingText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  reviewImages: {
    marginTop: 10,
    marginHorizontal: -4,
  },
  reviewImagesContent: {
    gap: 8,
    paddingRight: 4,
  },
  reviewImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  reviewFormCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  reviewFormLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 16,
  },
  starBtn: {
    padding: 4,
  },
  reviewInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
  reviewSubmitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  reviewSubmitBtnDisabled: {
    opacity: 0.5,
  },
  reviewSubmitText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  bottomPriceUnit: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bottomOriginal: {
    fontSize: 13,
    color: Colors.textTertiary,
    textDecorationLine: "line-through",
  },
  bookNowBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bookNowText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textInverse,
  },
});
