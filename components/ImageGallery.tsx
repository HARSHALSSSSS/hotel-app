import React, { useState } from "react";
import { StyleSheet, View, FlatList, Text } from "react-native";
import { Image } from "expo-image";
import { rs, rf, SCREEN_WIDTH } from "@/constants/responsive";

interface ImageGalleryProps {
  images: string[];
  height?: number;
}

export default function ImageGallery({ images, height = rs(300) }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width: SCREEN_WIDTH, height }} contentFit="cover" transition={200} />
        )}
        keyExtractor={(_, i) => i.toString()}
      />
      <View style={styles.pagination}>
        <View style={styles.paginationBg}>
          <Text style={styles.paginationText}>
            {activeIndex + 1}/{images.length}
          </Text>
        </View>
      </View>
      <View style={styles.dots}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  pagination: {
    position: "absolute",
    top: rs(16),
    right: rs(16),
  },
  paginationBg: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(12),
  },
  paginationText: {
    color: "#fff",
    fontSize: rf(12),
    fontWeight: "600" as const,
  },
  dots: {
    position: "absolute",
    bottom: rs(16),
    flexDirection: "row",
    alignSelf: "center",
    gap: rs(6),
  },
  dot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    width: rs(20),
    height: rs(6),
    backgroundColor: "#fff",
    borderRadius: rs(3),
  },
});
