import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "./query-client";
import { fetch } from "expo/fetch";

const TOKEN_KEY = "@stayease_access_token";
const REQUEST_TIMEOUT_MS = 20_000;
const HOTELS_FETCH_TIMEOUT_MS = 40_000;

/** Fetch with timeout to prevent infinite loading when API is unreachable */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e?.name === "AbortError") {
      throw new Error("Connection timeout. Please check your network and ensure the server is running.");
    }
    throw new Error(e?.message || "Network error. Please try again.");
  }
}
const REFRESH_KEY = "@stayease_refresh_token";
const USER_KEY = "@stayease_user";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  phone: string | null;
  gender: string | null;
  avatar: string | null;
  role: string;
  walletBalance: number;
  isVerified: boolean;
}

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  cachedToken = accessToken;
  await AsyncStorage.multiSet([
    [TOKEN_KEY, accessToken],
    [REFRESH_KEY, refreshToken],
  ]);
}

export async function clearAuth(): Promise<void> {
  cachedToken = null;
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY, USER_KEY]);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export async function storeUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function authFetch(path: string, options: RequestInit = {}, timeoutMs?: number): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl).toString();
  let token = await getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  const timeout = timeoutMs ?? REQUEST_TIMEOUT_MS;
  let res = await fetchWithTimeout(url, { ...options, headers }, timeout);

  if (res.status === 401 && token) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${cachedToken}`;
      res = await fetchWithTimeout(url, { ...options, headers }, timeout);
    }
  }

  return res;
}

async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;

    const baseUrl = getApiUrl();
    const res = await fetchWithTimeout(new URL("/api/auth/refresh", baseUrl).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    await setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function login(email: string, password: string): Promise<{ user: AuthUser }> {
  const baseUrl = getApiUrl();
  const url = new URL("/api/auth/login", baseUrl).toString();
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let message = "Login failed";
    try {
      const err = await res.json();
      if (err?.message) message = err.message;
    } catch {}
    throw new Error(message);
  }

  const data = await res.json();
  await setTokens(data.accessToken, data.refreshToken);
  await storeUser(data.user);
  return { user: data.user };
}

export async function register(email: string, username: string, password: string, name: string): Promise<{ user: AuthUser }> {
  const baseUrl = getApiUrl();
  const url = new URL("/api/auth/register", baseUrl).toString();
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, name }),
  });

  if (!res.ok) {
    let message = "Registration failed";
    try {
      const err = await res.json();
      if (err?.message) message = err.message;
    } catch {}
    throw new Error(message);
  }

  const data = await res.json();
  await setTokens(data.accessToken, data.refreshToken);
  await storeUser(data.user);
  return { user: data.user };
}

export async function autoLogin(): Promise<AuthUser | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await authFetch("/api/auth/profile");
    if (!res.ok) {
      await clearAuth();
      return null;
    }
    const user = await res.json();
    await storeUser(user);
    return user;
  } catch {
    return await getStoredUser();
  }
}

export async function requestOtp(email: string): Promise<{ message: string; otp?: string }> {
  const baseUrl = getApiUrl();
  const res = await fetch(new URL("/api/auth/otp/request", baseUrl).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send OTP");
  return data;
}

export async function verifyOtp(email: string, otp: string): Promise<{ user: AuthUser }> {
  const baseUrl = getApiUrl();
  const res = await fetch(new URL("/api/auth/otp/verify", baseUrl).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Invalid OTP");
  }
  const data = await res.json();
  await setTokens(data.accessToken, data.refreshToken);
  await storeUser(data.user);
  return { user: data.user };
}

export async function updateProfile(data: Partial<{ name: string; phone: string; avatar: string; gender: string }>): Promise<AuthUser> {
  const res = await authFetch("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Update failed");
  }
  const user = await res.json();
  await storeUser(user);
  return user;
}

export async function forgotPassword(email: string): Promise<{ message: string; otp?: string }> {
  const baseUrl = getApiUrl();
  const res = await fetch(new URL("/api/auth/forgot-password", baseUrl).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send OTP");
  return data;
}

export async function verifyResetOtp(email: string, otp: string): Promise<{ resetToken: string }> {
  const baseUrl = getApiUrl();
  const res = await fetch(new URL("/api/auth/verify-reset-otp", baseUrl).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Invalid OTP");
  return data;
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  const baseUrl = getApiUrl();
  const res = await fetch(new URL("/api/auth/reset-password", baseUrl).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resetToken, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reset password");
}
