import AsyncStorage from "@react-native-async-storage/async-storage";
import { Booking, Notification, SAMPLE_NOTIFICATIONS } from "./hotel-data";

const KEYS = {
  FAVORITES: "@stayease_favorites",
  BOOKINGS: "@stayease_bookings",
  NOTIFICATIONS: "@stayease_notifications",
  ONBOARDED: "@stayease_onboarded",
  USER_PROFILE: "@stayease_profile",
};

export async function getFavorites(): Promise<string[]> {
  const data = await AsyncStorage.getItem(KEYS.FAVORITES);
  return data ? JSON.parse(data) : [];
}

export async function toggleFavorite(hotelId: string): Promise<string[]> {
  const favs = await getFavorites();
  const idx = favs.indexOf(hotelId);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(hotelId);
  }
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
  return favs;
}

export async function getBookings(): Promise<Booking[]> {
  const data = await AsyncStorage.getItem(KEYS.BOOKINGS);
  return data ? JSON.parse(data) : [];
}

export async function addBooking(booking: Booking): Promise<void> {
  const bookings = await getBookings();
  bookings.unshift(booking);
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
}

export async function getNotifications(): Promise<Notification[]> {
  const data = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
  if (!data) {
    await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(SAMPLE_NOTIFICATIONS));
    return SAMPLE_NOTIFICATIONS;
  }
  return JSON.parse(data);
}

export async function markNotificationRead(id: string): Promise<void> {
  const notifs = await getNotifications();
  const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
  await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
}

export async function hasOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === "true";
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, "true");
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Guest User",
  email: "guest@stayease.com",
  phone: "+1 234 567 890",
  avatar: "#1B4B66",
};

export async function getUserProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : DEFAULT_PROFILE;
}

export async function updateUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}
