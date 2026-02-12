import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { authFetch, autoLogin, login as authLogin, register as authRegister, clearAuth, AuthUser } from "./auth";
import { CATEGORIES, POPULAR_DESTINATIONS } from "./hotel-data";

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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (hotelId: string) => Promise<void>;
  isFavorite: (hotelId: string) => boolean;
  markNotificationRead: (id: string) => Promise<void>;
  refreshHotels: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  createBooking: (data: any) => Promise<any>;
  cancelBooking: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hotels, setHotels] = useState<HotelListItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, hotelsRes] = await Promise.all([
          autoLogin(),
          authFetch("/api/hotels").then((r) => r.ok ? r.json() : []),
        ]);

        setHotels(hotelsRes || []);

        if (u) {
          setUser(u);
          const [favsRes, bookingsRes, notifsRes] = await Promise.all([
            authFetch("/api/favorites").then((r) => r.ok ? r.json() : []),
            authFetch("/api/bookings").then((r) => r.ok ? r.json() : []),
            authFetch("/api/notifications").then((r) => r.ok ? r.json() : []),
          ]);
          setFavorites(favsRes || []);
          setBookings(bookingsRes || []);
          setNotifications(notifsRes || []);
        }
      } catch (e) {
        console.log("Init error:", e);
      }
      setIsLoading(false);
    })();
  }, []);

  const featuredHotels = useMemo(() => hotels.filter((h) => h.featured), [hotels]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authLogin(email, password);
    setUser(result.user);

    const [favsRes, bookingsRes, notifsRes] = await Promise.all([
      authFetch("/api/favorites").then((r) => r.ok ? r.json() : []),
      authFetch("/api/bookings").then((r) => r.ok ? r.json() : []),
      authFetch("/api/notifications").then((r) => r.ok ? r.json() : []),
    ]);
    setFavorites(favsRes || []);
    setBookings(bookingsRes || []);
    setNotifications(notifsRes || []);
  }, []);

  const registerFn = useCallback(async (email: string, username: string, password: string, name: string) => {
    const result = await authRegister(email, username, password, name);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
    setFavorites([]);
    setBookings([]);
    setNotifications([]);
  }, []);

  const toggleFavorite = useCallback(async (hotelId: string) => {
    try {
      const res = await authFetch(`/api/favorites/${hotelId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.favorited) {
          setFavorites((prev) => [...prev, hotelId]);
        } else {
          setFavorites((prev) => prev.filter((id) => id !== hotelId));
        }
      }
    } catch (e) {
      console.log("Toggle favorite error:", e);
    }
  }, []);

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
    try {
      const res = await authFetch("/api/hotels");
      if (res.ok) setHotels(await res.json());
    } catch {}
  }, []);

  const refreshBookings = useCallback(async () => {
    try {
      const res = await authFetch("/api/bookings");
      if (res.ok) setBookings(await res.json());
    } catch {}
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await authFetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
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
    return booking;
  }, [refreshBookings, refreshNotifications]);

  const cancelBooking = useCallback(async (id: string) => {
    const res = await authFetch(`/api/bookings/${id}/cancel`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Cancel failed");
    }
    await refreshBookings();
    await refreshNotifications();
  }, [refreshBookings, refreshNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const isAuthenticated = !!user;

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      hotels,
      featuredHotels,
      favorites,
      bookings,
      notifications,
      unreadCount,
      isLoading,
      login,
      register: registerFn,
      logout,
      toggleFavorite,
      isFavorite,
      markNotificationRead,
      refreshHotels,
      refreshBookings,
      refreshNotifications,
      createBooking,
      cancelBooking,
    }),
    [user, isAuthenticated, hotels, featuredHotels, favorites, bookings, notifications, unreadCount, isLoading, login, registerFn, logout, toggleFavorite, isFavorite, markNotificationRead, refreshHotels, refreshBookings, refreshNotifications, createBooking, cancelBooking]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { CATEGORIES, POPULAR_DESTINATIONS };
