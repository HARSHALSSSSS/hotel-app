/**
 * Optimize image URLs for fast loading on mobile (especially APK).
 * - Cards/lists: smaller size (w=400, q=75) = faster loads
 * - Detail/hero: full size (w=800, q=80)
 */
export type ImageSize = "thumb" | "card" | "full";

const SIZES: Record<ImageSize, { w: number; q: number }> = {
  thumb: { w: 300, q: 70 },
  card: { w: 400, q: 75 },
  full: { w: 800, q: 80 },
};

/** Guaranteed-to-load fallback image - use when primary fails or is missing */
export const FALLBACK_HOTEL_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80";

/** Full-size fallback for hero/detail carousel */
export const FALLBACK_HOTEL_IMAGE_FULL = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";

/** Check if a URL is valid for display (http(s), or Unsplash photo ID) */
export function isValidImageUrl(u: unknown): boolean {
  if (typeof u !== "string") return false;
  const t = u.trim();
  return t.length > 5 && (t.startsWith("http") || /^[\d]+-[\w-]+$/.test(t) || /^photo-?[\w-]+$/.test(t));
}

/** Build full Unsplash URL from photo ID (e.g. "1566073771259-6a8506099945") */
function buildUnsplashUrl(id: string, size: ImageSize): string {
  const { w, q } = SIZES[size];
  const cleanId = id.replace(/^photo-/, "").trim();
  return `https://images.unsplash.com/photo-${cleanId}?w=${w}&q=${q}`;
}

/** Get optimized image URL for display size. Unsplash URLs are modified; others pass through. */
export function getOptimizedImageUrl(uri: string | undefined | null, size: ImageSize = "card"): string {
  if (!uri || typeof uri !== "string") return "";
  const trimmed = uri.trim();
  if (!trimmed) return "";
  const { w, q } = SIZES[size];
  // Unsplash full URL: photo-{id}?w=800&q=80 → w=400&q=75 for cards
  if (trimmed.includes("images.unsplash.com") && trimmed.includes("photo-")) {
    try {
      const u = new URL(trimmed);
      u.searchParams.set("w", String(w));
      u.searchParams.set("q", String(q));
      return u.toString();
    } catch {
      return trimmed;
    }
  }
  // Unsplash photo ID only (e.g. "1566073771259-6a8506099945" or "photo-1566073771259-6a8506099945")
  if (/^photo-?[\w-]+$/.test(trimmed) || /^[\d]+-[\w-]+$/.test(trimmed)) {
    return buildUnsplashUrl(trimmed, size);
  }
  // via.placeholder, other CDNs - use as-is
  return trimmed;
}
