import React, { useState } from "react";
import { Image, ImageProps } from "expo-image";
import { FALLBACK_HOTEL_IMAGE, getOptimizedImageUrl } from "@/lib/image-utils";

interface HotelImageProps extends Omit<ImageProps, "source"> {
  /** Primary image URI or Unsplash ID - can be from hotel.images[0] */
  uri: string | undefined | null;
  /** Size preset for optimization */
  size?: "thumb" | "card" | "full";
  /** Fallback when primary fails to load - defaults to guaranteed working image */
  fallbackUri?: string;
}

/**
 * Hotel image that never shows blank - falls back to placeholder on load error.
 * Use for all hotel card/list images on Home, Explore, Saved, etc.
 */
export function HotelImage({
  uri,
  size = "card",
  fallbackUri = FALLBACK_HOTEL_IMAGE,
  style,
  ...props
}: HotelImageProps) {
  const [failed, setFailed] = useState(false);
  const primary = getOptimizedImageUrl(uri, size) || fallbackUri;
  const effectiveUri = failed || !primary ? fallbackUri : primary;

  return (
    <Image
      {...props}
      source={{ uri: effectiveUri }}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
