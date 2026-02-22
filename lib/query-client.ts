import { Platform } from "react-native";
import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

function isLocalOrPrivateHost(host: string): boolean {
  const hostPart = host.split(":")[0];
  return (
    hostPart === "localhost" ||
    hostPart === "127.0.0.1" ||
    hostPart === "10.0.2.2" ||
    hostPart.startsWith("10.") ||
    hostPart.startsWith("192.168.") ||
    hostPart.startsWith("172.16.") ||
    hostPart.startsWith("172.17.") ||
    hostPart.startsWith("172.18.") ||
    hostPart.startsWith("172.19.") ||
    hostPart.startsWith("172.2") ||
    hostPart.startsWith("172.30.") ||
    hostPart.startsWith("172.31.")
  );
}

export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN || "localhost:5000";
  if (Platform.OS === "android" && (host.startsWith("localhost") || host.startsWith("127.0.0.1"))) {
    host = host.replace(/^localhost|^127\.0\.0\.1/, "10.0.2.2");
  }
  const protocol = isLocalOrPrivateHost(host) ? "http" : "https";
  return `${protocol}://${host}`.replace(/\/$/, "");
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url.toString(), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url.toString(), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
