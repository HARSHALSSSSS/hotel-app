import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { Image } from "expo-image";
import { authFetch, autoLogin, login as authLogin, register as authRegister, clearAuth, requestOtp as authRequestOtp, verifyOtp as authVerifyOtp, updateProfile as authUpdateProfile, AuthUser } from "./auth";
import { connectRealtime } from "./realtime";
import { createRazorpayOrder, verifyRazorpayPayment, openRazorpayCheckout, type BookingDataForPayment } from "./razorpay";
import { CATEGORIES, POPULAR_DESTINATIONS } from "./hotel-data";

const USER_LOCATION_KEY = "@stayease_user_location";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";

function normalizeHotels(list: any[]): HotelListItem[] {
  return list.map((h: any) => {
    let images = h.images;
    if (typeof images === "string") {
      try { images = JSON.parse(images); } catch { images = []; }
    }
    if (!Array.isArray(images)) images = [];
    const valid = images.filter((u) => {
      if (typeof u !== "string") return false;
      const t = u.trim();
      return t.length > 5 && (t.startsWith("http") || /^[\d]+-[\w-]+$/.test(t) || /^photo-?[\w-]+$/.test(t));
    });
    return {
      ...h,
      images: valid.length ? valid : [FALLBACK_IMAGE],
    };
  });
}
const LOCATION_DISPLAY_KEY = "@stayease_location_display";
const LOCATION_PROMPT_SEEN_KEY = "@stayease_location_prompt_seen";
const ONBOARDING_COMPLETE_KEY = "@stayease_onboarding_complete";
const HOTELS_CACHE_KEY = "@stayease_hotels_cache";

export interface HotelListItem {
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
}

export interface BookingItem {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelImage: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  location?: string;
  rating?: number;
  nights?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface AppContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hotels: HotelListItem[];
  featuredHotels: HotelListItem[];
  favorites: string[];
  bookings: BookingItem[];
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  hotelsLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, username: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (hotelId: string) => Promise<void>;
  isFavorite: (hotelId: string) => boolean;
  markNotificationRead: (id: string) => Promise<void>;
  refreshHotels: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  createBooking: (data: any) => Promise<any>;
  createBookingWithRazorpay: (bookingData: { hotelId: string; roomId: string; checkIn: string; checkOut: string; guests: number; nights: number }, totalINR: number, upiApp?: "phonepe" | "gpay") => Promise<any>;
  cancelBooking: (id: string, reason?: string) => Promise<void>;
  getHotelById: (id: string) => HotelListItem | null;
  searchHotels: (query: string, category: string, minPrice?: number, maxPrice?: number, minRating?: number) => HotelListItem[];
  savedHotels: HotelListItem[];
  refreshSavedHotels: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  requestOtp: (email: string) => Promise<{ message: string; otp?: string }>;
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  updateUserProfile: (data: Partial<{ name: string; phone: string; avatar: string }>) => Promise<void>;
  fetchNearbyHotels: (lat: number, lng: number, radiusKm?: number) => Promise<HotelListItem[]>;
  getBookingById: (id: string) => Promise<BookingItem | null>;
  createReview: (data: { hotelId: string; rating: number; comment: string; bookingId?: string; images?: string[] }) => Promise<void>;
  refreshUser: () => Promise<void>;
  topUpWallet: (amount: number) => Promise<{ balance: number }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  exploreLocation: { lat: number; lng: number } | null;
  setExploreLocation: (loc: { lat: number; lng: number } | null) => void;
  exploreQuery: string;
  setExploreQuery: (q: string) => void;
  searchFilters: { sortBy: string; minPrice: number; maxPrice: number; minRating: number; facility: string; bedroom: string };
  setSearchFilters: (f: { sortBy: string; minPrice: number; maxPrice: number; minRating: number; facility: string; bedroom: string }) => void;
  userLocation: { latitude: number; longitude: number } | null;
  setUserLocation: (loc: { latitude: number; longitude: number } | null) => void;
  locationDisplayName: string;
  setLocationDisplayName: (name: string) => void;
  hasSeenLocationPrompt: boolean;
  setHasSeenLocationPrompt: (seen: boolean) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  incomingCall: { callId: string; hotelId: string; hotelName: string; fromUserId: string; fromName: string } | null;
  setIncomingCall: (call: { callId: string; hotelId: string; hotelName: string; fromUserId: string; fromName: string } | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hotels, setHotels] = useState<HotelListItem[]>([]);
  const [savedHotels, setSavedHotels] = useState<HotelListItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [exploreLocation, setExploreLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [exploreQuery, setExploreQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    sortBy: "popular",
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    facility: "All",
    bedroom: "1",
  });
  const [userLocation, setUserLocationState] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationDisplayName, setLocationDisplayNameState] = useState("");
  const [hasSeenLocationPrompt, setHasSeenLocationPromptState] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    hotelId: string;
    hotelName: string;
    fromUserId: string;
    fromName: string;
  } | null>(null);

  const setUserLocation = useCallback((loc: { latitude: number; longitude: number } | null) => {
    setUserLocationState(loc);
    if (loc) AsyncStorage.setItem(USER_LOCATION_KEY, JSON.stringify(loc));
    else AsyncStorage.removeItem(USER_LOCATION_KEY);
  }, []);

  const setLocationDisplayName = useCallback((name: string) => {
    setLocationDisplayNameState(name);
    if (name) AsyncStorage.setItem(LOCATION_DISPLAY_KEY, name);
    else AsyncStorage.removeItem(LOCATION_DISPLAY_KEY);
  }, []);
  const setHasSeenLocationPrompt = useCallback((seen: boolean) => {
    setHasSeenLocationPromptState(seen);
    AsyncStorage.setItem(LOCATION_PROMPT_SEEN_KEY, seen ? "true" : "false");
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboardingState(true);
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  }, []);

  const refreshBookingsRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const refreshNotificationsRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    if (!user) return;
    const disconnect = connectRealtime((msg) => {
      if (msg.type === "booking:created" || msg.type === "booking:cancelled" || msg.type === "booking:status_changed") {
        refreshBookingsRef.current();
        refreshNotificationsRef.current();
      }
      if (msg.type === "call:incoming") {
        setIncomingCall({
          callId: msg.callId,
          hotelId: msg.hotelId,
          hotelName: msg.hotelName,
          fromUserId: msg.fromUserId,
          fromName: msg.fromName,
        });
      }
    });
    return disconnect;
  }, [user]);

  useEffect(() => {
    const INIT_TIMEOUT_MS = 5_000;

    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Init timeout")), ms));

    (async () => {
      try {
        const [u, locData, locDisplayData, seenData, onboardingData] = await Promise.race([
          Promise.all([
            autoLogin(),
            AsyncStorage.getItem(USER_LOCATION_KEY),
            AsyncStorage.getItem(LOCATION_DISPLAY_KEY),
            AsyncStorage.getItem(LOCATION_PROMPT_SEEN_KEY),
            AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
          ]),
          timeout(INIT_TIMEOUT_MS),
        ]);

        if (locData) {
          try {
            const loc = JSON.parse(locData);
            if (loc && typeof loc.latitude === "number" && typeof loc.longitude === "number") {
              setUserLocationState(loc);
              setExploreLocation({ lat: loc.latitude, lng: loc.longitude });
            }
          } catch {}
        }
        if (locDisplayData && typeof locDisplayData === "string") setLocationDisplayNameState(locDisplayData.trim());
        if (seenData === "true") setHasSeenLocationPromptState(true);
        if (onboardingData === "true") setHasCompletedOnboardingState(true);

        if (u) {
          setUser(u);
          Promise.all([
            authFetch("/api/favorites").then((r) => r.ok ? r.json() : []),
            authFetch("/api/bookings").then((r) => r.ok ? r.json() : []),
            authFetch("/api/notifications").then((r) => r.ok ? r.json() : []),
            authFetch("/api/favorites/hotels").then((r) => r.ok ? r.json() : []),
          ])
            .then(([favsRes, bookingsRes, notifsRes, savedHotelsRes]) => {
              setFavorites(favsRes || []);
              setBookings(bookingsRes || []);
              setNotifications(notifsRes || []);
              setSavedHotels(savedHotelsRes || []);
            })
            .catch(() => {});
        }
      } catch (e) {
        console.log("Init error:", e);
      }

      setIsLoading(false);
      SplashScreen.hideAsync().catch(() => {});

      const cachedRaw = await AsyncStorage.getItem(HOTELS_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as HotelListItem[];
          if (Array.isArray(cached) && cached.length > 0) {
            setHotels(cached);
            setHotelsLoading(false);
          }
        } catch {}
      }

      const fetchHotels = async (): Promise<HotelListItem[]> => {
        try {
          const res = await authFetch("/api/hotels", {}, 20000);
          const data = res.ok ? await res.json() : [];
          const list = Array.isArray(data) ? data : [];
          return normalizeHotels(list);
        } catch {
          return [];
        }
      };

      // Fetch hotels immediately — no artificial delay
      let normalized = await fetchHotels();
      // Retry with shorter delays if server was cold-starting (Render free tier)
      const retryDelays = [3000, 6000, 10000];
      for (let i = 0; i < retryDelays.length && normalized.length === 0; i++) {
        await new Promise((r) => setTimeout(r, retryDelays[i]));
        normalized = await fetchHotels();
      }
      if (normalized.length > 0) {
        setHotels(normalized);
      }
      setHotelsLoading(false);
      if (normalized.length > 0) {
        try {
          await AsyncStorage.setItem(HOTELS_CACHE_KEY, JSON.stringify(normalized));
        } catch {}
        import("@/lib/image-utils").then(({ getOptimizedImageUrl, FALLBACK_HOTEL_IMAGE }) => {
          const urls = normalized
            .slice(0, 35)
            .map((h) => getOptimizedImageUrl(h?.images?.[0], "card"))
            .filter(Boolean) as string[];
          const uniqueUrls = [...new Set([FALLBACK_HOTEL_IMAGE, ...urls])];
          Image.prefetch(uniqueUrls, "memory-disk").catch(() => {});
        });
      }
    })();
  }, []);

  const featuredHotels = useMemo(() => hotels.filter((h) => h.featured), [hotels]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const result = await authLogin(email, password);
    setUser(result.user);
    Promise.all([
      authFetch("/api/favorites").then((r) => r.ok ? r.json() : []),
      authFetch("/api/bookings").then((r) => r.ok ? r.json() : []),
      authFetch("/api/notifications").then((r) => r.ok ? r.json() : []),
      authFetch("/api/favorites/hotels").then((r) => r.ok ? r.json() : []),
    ]).then(([favsRes, bookingsRes, notifsRes, savedHotelsRes]) => {
      setFavorites(favsRes || []);
      setBookings(bookingsRes || []);
      setNotifications(notifsRes || []);
      setSavedHotels(savedHotelsRes || []);
    });
    return result.user;
  }, []);

  const registerFn = useCallback(async (email: string, username: string, password: string, name: string) => {
    const result = await authRegister(email, username, password, name);
    setUser(result.user);
    Promise.all([
      authFetch("/api/favorites").then((r) => r.ok ? r.json() : []),
      authFetch("/api/bookings").then((r) => r.ok ? r.json() : []),
      authFetch("/api/notifications").then((r) => r.ok ? r.json() : []),
      authFetch("/api/favorites/hotels").then((r) => r.ok ? r.json() : []),
    ]).then(([favsRes, bookingsRes, notifsRes, savedHotelsRes]) => {
      setFavorites(favsRes || []);
      setBookings(bookingsRes || []);
      setNotifications(notifsRes || []);
      setSavedHotels(savedHotelsRes || []);
    });
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
    setFavorites([]);
    setBookings([]);
    setNotifications([]);
    setSavedHotels([]);
  }, []);

  const toggleFavorite = useCallback(async (hotelId: string) => {
    try {
      const res = await authFetch(`/api/favorites/${hotelId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.favorited) {
          setFavorites((prev) => [...prev, hotelId]);
          const hotel = hotels.find((h) => h.id === hotelId);
          if (hotel) setSavedHotels((prev) => (prev.some((h) => h.id === hotelId) ? prev : [...prev, hotel]));
        } else {
          setFavorites((prev) => prev.filter((id) => id !== hotelId));
          setSavedHotels((prev) => prev.filter((h) => h.id !== hotelId));
        }
      }
    } catch (e) {
      console.log("Toggle favorite error:", e);
    }
  }, [hotels]);

  const refreshSavedHotels = useCallback(async () => {
    try {
      const res = await authFetch("/api/favorites/hotels");
      if (res.ok) setSavedHotels(await res.json());
    } catch {}
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const res = await authFetch("/api/notifications/read-all", { method: "PUT" });
      if (res.ok) setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.log("Mark all read error:", e);
    }
  }, []);

  const getHotelById = useCallback((id: string) => hotels.find((h) => h.id === id) ?? null, [hotels]);

  const searchHotels = useCallback(
    (query: string, category: string, minPrice?: number, maxPrice?: number, minRating?: number) => {
      let list = [...hotels];
      if (category && category !== "all") {
        list = list.filter((h) => h.category === category);
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        list = list.filter(
          (h) =>
            h.name.toLowerCase().includes(q) ||
            h.location?.toLowerCase().includes(q) ||
            h.city?.toLowerCase().includes(q) ||
            h.country?.toLowerCase().includes(q)
        );
      }
      if (minPrice != null) list = list.filter((h) => h.pricePerNight >= minPrice);
      if (maxPrice != null) list = list.filter((h) => h.pricePerNight <= maxPrice);
      if (minRating != null) list = list.filter((h) => h.rating >= minRating);
      return list;
    },
    [hotels]
  );

  const isFavorite = useCallback((hotelId: string) => favorites.includes(hotelId), [favorites]);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await authFetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.log("Mark read error:", e);
    }
  }, []);

  const refreshHotels = useCallback(async () => {
    const fetchHotels = async (): Promise<HotelListItem[]> => {
      try {
        const res = await authFetch("/api/hotels", {}, 20000);
        const data = res.ok ? await res.json() : [];
        const list = Array.isArray(data) ? data : [];
        return normalizeHotels(list);
      } catch {
        return [];
      }
    };
    let normalized = await fetchHotels();
    const retryDelays = [2000, 4000, 8000];
    for (let i = 0; i < retryDelays.length && normalized.length === 0; i++) {
      await new Promise((r) => setTimeout(r, retryDelays[i]));
      normalized = await fetchHotels();
    }
    setHotels(normalized);
    if (normalized.length > 0) {
      AsyncStorage.setItem(HOTELS_CACHE_KEY, JSON.stringify(normalized)).catch(() => {});
      const { getOptimizedImageUrl, FALLBACK_HOTEL_IMAGE } = await import("@/lib/image-utils");
      const urls = normalized.slice(0, 35).map((h) => getOptimizedImageUrl(h?.images?.[0], "card")).filter(Boolean) as string[];
      const uniqueUrls = [...new Set([FALLBACK_HOTEL_IMAGE, ...urls])];
      if (uniqueUrls.length > 0) Image.prefetch(uniqueUrls, "memory-disk").catch(() => {});
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    try {
      const res = await authFetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map((b: any) => {
          let img = b.hotelImage;
          if (typeof img === "string" && img.startsWith("[")) { try { img = JSON.parse(img); } catch {} }
          if (Array.isArray(img)) img = img[0] ?? "";
          return { ...b, hotelImage: typeof img === "string" ? img : "" };
        });
        setBookings(normalized);
      }
    } catch {}
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await authFetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    refreshBookingsRef.current = refreshBookings;
    refreshNotificationsRef.current = refreshNotifications;
  }, [refreshBookings, refreshNotifications]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authFetch("/api/auth/profile");
      if (res.ok) {
        const u = await res.json();
        setUser(u);
      }
    } catch {}
  }, []);

  const createBooking = useCallback(async (data: any) => {
    const res = await authFetch("/api/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Booking failed");
    }
    const booking = await res.json();
    await refreshBookings();
    await refreshNotifications();
    if (data.paymentMethod === "wallet") await refreshUser();
    return booking;
  }, [refreshBookings, refreshNotifications, refreshUser]);

  const createBookingWithRazorpay = useCallback(
    async (
      bookingData: { hotelId: string; roomId: string; checkIn: string; checkOut: string; guests: number; nights: number },
      totalINR: number,
      upiApp?: "phonepe" | "gpay"
    ) => {
      const order = await createRazorpayOrder(totalINR, bookingData as BookingDataForPayment);
      return new Promise((resolve, reject) => {
        openRazorpayCheckout({
          key: order.key,
          orderId: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: "Hotel Booking Hub",
          description: "Booking payment",
          bookingData: bookingData as BookingDataForPayment,
          upiApp,
          prefillContact: user?.phone,
          onSuccess: async (response) => {
            try {
              const booking = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingData: bookingData as BookingDataForPayment,
              });
              await refreshBookings();
              await refreshNotifications();
              resolve(booking);
            } catch (e) {
              reject(e);
            }
          },
          onClose: () => reject(new Error("Payment cancelled")),
        });
      });
    },
    [refreshBookings, refreshNotifications, user]
  );

  const cancelBooking = useCallback(async (id: string, reason?: string) => {
    const res = await authFetch(`/api/bookings/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: reason ? JSON.stringify({ reason }) : undefined,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Cancel failed");
    }
    await refreshBookings();
    await refreshNotifications();
  }, [refreshBookings, refreshNotifications]);

  const requestOtp = useCallback(async (email: string) => {
    return authRequestOtp(email);
  }, []);

  const loginWithOtp = useCallback(async (email: string, otp: string) => {
    const result = await authVerifyOtp(email, otp);
    setUser(result.user);
    const [favsRes, bookingsRes, notifsRes, savedHotelsRes] = await Promise.all([
      authFetch("/api/favorites").then((r) => r.ok ? r.json() : []),
      authFetch("/api/bookings").then((r) => r.ok ? r.json() : []),
      authFetch("/api/notifications").then((r) => r.ok ? r.json() : []),
      authFetch("/api/favorites/hotels").then((r) => r.ok ? r.json() : []),
    ]);
    setFavorites(favsRes || []);
    setBookings(bookingsRes || []);
    setNotifications(notifsRes || []);
    setSavedHotels(savedHotelsRes || []);
  }, []);

  const updateUserProfile = useCallback(async (data: Partial<{ name: string; phone: string; avatar: string }>) => {
    const updated = await authUpdateProfile(data);
    setUser(updated);
  }, []);

  const topUpWallet = useCallback(async (amount: number): Promise<{ balance: number }> => {
    const res = await authFetch("/api/wallet/top-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Top-up failed");
    }
    const data = await res.json();
    await refreshUser();
    return data;
  }, [refreshUser]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const res = await authFetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to change password");
    }
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    const res = await authFetch("/api/auth/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to delete account");
    }
    await clearAuth();
    setUser(null);
    setFavorites([]);
    setBookings([]);
    setNotifications([]);
    setSavedHotels([]);
  }, []);

  const fetchNearbyHotels = useCallback(async (lat: number, lng: number, radiusKm = 50): Promise<HotelListItem[]> => {
    const res = await authFetch(`/api/hotels/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, []);

  const getBookingById = useCallback(async (id: string): Promise<BookingItem | null> => {
    try {
      const res = await authFetch(`/api/bookings/${id}`);
      if (!res.ok) return null;
      const b = await res.json();
      return {
        id: b.id,
        hotelId: b.hotelId,
        hotelName: b.hotelName ?? "",
        hotelImage: (() => { let img = b.hotelImage; if (typeof img === "string" && img.startsWith("[")) { try { img = JSON.parse(img); } catch {} } return typeof img === "string" ? img : Array.isArray(img) ? img[0] ?? "" : ""; })(),
        roomName: b.roomName,
        checkIn: typeof b.checkIn === "string" ? b.checkIn : new Date(b.checkIn).toISOString(),
        checkOut: typeof b.checkOut === "string" ? b.checkOut : new Date(b.checkOut).toISOString(),
        guests: b.guests ?? 1,
        totalPrice: b.totalPrice ?? 0,
        status: b.status ?? "pending",
        createdAt: typeof b.createdAt === "string" ? b.createdAt : new Date(b.createdAt).toISOString(),
        location: b.location,
        rating: b.rating != null ? Number(b.rating) : undefined,
        nights: b.nights,
      };
    } catch {
      return null;
    }
  }, []);

  const createReview = useCallback(async (data: { hotelId: string; rating: number; comment: string; bookingId?: string; images?: string[] }) => {
    const res = await authFetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to submit review");
    }
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      hotels,
      featuredHotels,
      favorites,
      savedHotels,
      bookings,
      notifications,
      unreadCount,
      isLoading,
      hotelsLoading,
      login,
      register: registerFn,
      logout,
      toggleFavorite,
      isFavorite,
      markNotificationRead,
      markAllNotificationsRead,
      refreshHotels,
      refreshBookings,
      refreshNotifications,
      refreshSavedHotels,
      createBooking,
      createBookingWithRazorpay,
      cancelBooking,
      getHotelById,
      searchHotels,
      requestOtp,
      loginWithOtp,
      updateUserProfile,
      fetchNearbyHotels,
      getBookingById,
      createReview,
      refreshUser,
      topUpWallet,
      changePassword,
      deleteAccount,
      exploreLocation,
      setExploreLocation,
      exploreQuery,
      setExploreQuery,
      searchFilters,
      setSearchFilters,
      userLocation,
      setUserLocation,
      locationDisplayName,
      setLocationDisplayName,
      hasSeenLocationPrompt,
      setHasSeenLocationPrompt,
      hasCompletedOnboarding,
      completeOnboarding,
      incomingCall,
      setIncomingCall,
    }),
    [user, isAuthenticated, hotels, featuredHotels, favorites, savedHotels, bookings, notifications, unreadCount, isLoading, hotelsLoading, login, registerFn, logout, toggleFavorite, isFavorite, markNotificationRead, markAllNotificationsRead, refreshHotels, refreshBookings, refreshNotifications, refreshSavedHotels, createBooking, createBookingWithRazorpay, cancelBooking, getHotelById, searchHotels, requestOtp, loginWithOtp, updateUserProfile, fetchNearbyHotels, getBookingById, createReview, refreshUser, topUpWallet, changePassword, deleteAccount, exploreLocation, exploreQuery, searchFilters, userLocation, setUserLocation, locationDisplayName, setLocationDisplayName, hasSeenLocationPrompt, setHasSeenLocationPrompt, hasCompletedOnboarding, completeOnboarding, incomingCall, setIncomingCall]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { CATEGORIES, POPULAR_DESTINATIONS };
