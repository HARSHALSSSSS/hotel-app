import React, { useState, useRef } from "react";
import { StyleSheet, View, FlatList, Dimensions, Text } from "react-native";
import { Image } from "expo-image";

const { width } = Dimensions.get("window");

interface ImageGalleryProps {
  images: string[];
  height?: number;
}

export default function ImageGallery({ images, height = 300 }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(idx);
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width, height }} contentFit="cover" transition={200} />
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
    top: 16,
    right: 16,
  },
  paginationBg: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paginationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  dots: {
    position: "absolute",
    bottom: 16,
    flexDirection: "row",
    alignSelf: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    width: 20,
    backgroundColor: "#fff",
    borderRadius: 3,
  },
});
