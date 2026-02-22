import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const SCALE_WIDTH = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.2);
const FONT_SCALE = Math.min(Math.max(width / BASE_WIDTH, 0.9), 1.15);

/**
 * Responsive scale for spacing, dimensions, icon sizes
 * Use for: padding, margin, width, height, borderRadius, etc.
 */
export function rs(size: number): number {
  return Math.round(size * SCALE_WIDTH);
}

/**
 * Responsive font size - scales less aggressively for readability
 */
export function rf(size: number): number {
  return Math.round(size * FONT_SCALE);
}

/**
 * Width percentage (e.g. wp(50) = 50% of screen width)
 */
export function wp(percent: number): number {
  return (width * percent) / 100;
}

/**
 * Height percentage
 */
export function hp(percent: number): number {
  return (height * percent) / 100;
}

/**
 * Minimum touch target (44dp) - ensures buttons remain tappable on small screens
 */
export const MIN_TOUCH = rs(44);

/** Screen dimensions for use in components */
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
