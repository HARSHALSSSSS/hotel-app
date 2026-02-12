import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { HOTELS, Hotel, Booking, Notification } from "./hotel-data";
import * as Storage from "./storage";

interface AppContextValue {
  favorites: string[];
  bookings: Booking[];
  notifications: Notification[];
  toggleFavorite: (hotelId: string) => Promise<void>;
  isFavorite: (hotelId: string) => boolean;
  addBooking: (booking: Booking) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  unreadCount: number;
  getHotelById: (id: string) => Hotel | undefined;
  searchHotels: (query: string, category?: string, minPrice?: number, maxPrice?: number, minRating?: number) => Hotel[];
  isLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [favs, bks, notifs] = await Promise.all([
        Storage.getFavorites(),
        Storage.getBookings(),
        Storage.getNotifications(),
      ]);
      setFavorites(favs);
      setBookings(bks);
      setNotifications(notifs);
      setIsLoading(false);
    })();
  }, []);

  const toggleFavorite = useCallback(async (hotelId: string) => {
    const updated = await Storage.toggleFavorite(hotelId);
    setFavorites(updated);
  }, []);

  const isFavorite = useCallback((hotelId: string) => favorites.includes(hotelId), [favorites]);

  const addBooking = useCallback(async (booking: Booking) => {
    await Storage.addBooking(booking);
    setBookings((prev) => [booking, ...prev]);
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await Storage.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const getHotelById = useCallback((id: string) => HOTELS.find((h) => h.id === id), []);

  const searchHotels = useCallback(
    (query: string, category?: string, minPrice?: number, maxPrice?: number, minRating?: number) => {
      let results = HOTELS;
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(
          (h) =>
            h.name.toLowerCase().includes(q) ||
            h.location.toLowerCase().includes(q) ||
            h.city.toLowerCase().includes(q) ||
            h.country.toLowerCase().includes(q)
        );
      }
      if (category && category !== "all") {
        results = results.filter((h) => h.category === category);
      }
      if (minPrice !== undefined) {
        results = results.filter((h) => h.pricePerNight >= minPrice);
      }
      if (maxPrice !== undefined) {
        results = results.filter((h) => h.pricePerNight <= maxPrice);
      }
      if (minRating !== undefined) {
        results = results.filter((h) => h.rating >= minRating);
      }
      return results;
    },
    []
  );

  const value = useMemo(
    () => ({
      favorites,
      bookings,
      notifications,
      toggleFavorite,
      isFavorite,
      addBooking,
      markNotificationRead,
      unreadCount,
      getHotelById,
      searchHotels,
      isLoading,
    }),
    [favorites, bookings, notifications, toggleFavorite, isFavorite, addBooking, markNotificationRead, unreadCount, getHotelById, searchHotels, isLoading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
