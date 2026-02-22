import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, FlatList, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { rs, rf, SCREEN_WIDTH } from "@/constants/responsive";
import Colors from "@/constants/colors";
import { getOptimizedImageUrl, FALLBACK_HOTEL_IMAGE_FULL } from "@/lib/image-utils";
import { HotelImage } from "./HotelImage";

const THUMB_SIZE = rs(72);
const THUMB_GAP = rs(8);
const THUMB_MARGIN = rs(16);
const MAX_VISIBLE_THUMBS = 5;

interface HotelImageCarouselProps {
  images: string[];
  height?: number;
}

export default function HotelImageCarousel({ images, height = rs(320) }: HotelImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mainRef = useRef<FlatList>(null);
  const thumbRef = useRef<ScrollView>(null);

  const list =
    images.length > 0
      ? images.filter((u) => typeof u === "string" && u.trim().length > 0)
      : [FALLBACK_HOTEL_IMAGE_FULL];
  const displayList = list.length > 0 ? list : [FALLBACK_HOTEL_IMAGE_FULL];

  useEffect(() => {
    const urls = displayList.slice(0, 6).map((u) => getOptimizedImageUrl(u, "full"));
    const fallback = getOptimizedImageUrl(FALLBACK_HOTEL_IMAGE_FULL, "full");
    Image.prefetch([fallback, ...urls].filter(Boolean) as string[], "memory-disk").catch(() => {});
  }, [images?.length, images?.[0]]);
  const hasMore = displayList.length > MAX_VISIBLE_THUMBS;
  const moreCount = displayList.length - MAX_VISIBLE_THUMBS;

  const onMainScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(idx);
  };

  const onThumbPress = (index: number) => {
    mainRef.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  };

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        ref={mainRef}
        data={displayList}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMainScroll}
        renderItem={({ item, index }) => (
          <HotelImage
            uri={item}
            size="full"
            fallbackUri={FALLBACK_HOTEL_IMAGE_FULL}
            style={[styles.mainImage, { width: SCREEN_WIDTH, height }]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority={index === 0 ? "high" : "normal"}
            recyclingKey={`carousel-${index}-${item}`}
          />
        )}
        keyExtractor={(_, i) => i.toString()}
      />
      <View style={styles.thumbStrip}>
        <ScrollView
          ref={thumbRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbList}
        >
          {displayList.slice(0, hasMore ? MAX_VISIBLE_THUMBS : displayList.length).map((uri, i) => (
            <Pressable
              key={i}
              style={[styles.thumb, i === activeIndex && styles.thumbActive]}
              onPress={() => onThumbPress(i)}
            >
              <HotelImage
                uri={uri}
                size="thumb"
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={100}
                cachePolicy="memory-disk"
                recyclingKey={`thumb-${i}-${uri}`}
              />
            </Pressable>
          ))}
          {hasMore && (
            <Pressable style={styles.thumbMore} onPress={() => onThumbPress(MAX_VISIBLE_THUMBS)}>
              <Text style={styles.thumbMoreText}>+{moreCount}</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  mainImage: {
    backgroundColor: Colors.surfaceElevated,
  },
  thumbStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: rs(16),
  },
  thumbList: {
    flexDirection: "row",
    gap: THUMB_GAP,
    paddingHorizontal: THUMB_MARGIN,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: rs(10),
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: Colors.surfaceElevated,
  },
  thumbActive: {
    borderColor: "#fff",
  },
  thumbMore: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: rs(10),
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbMoreText: {
    color: "#fff",
    fontSize: rf(14),
    fontWeight: "700",
  },
});
