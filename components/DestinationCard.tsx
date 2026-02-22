import React from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { rs, rf } from "@/constants/responsive";

interface DestinationCardProps {
  name: string;
  country: string;
  image: string;
  hotelCount: number;
  onPress: () => void;
}

export default function DestinationCard({ name, country, image, hotelCount, onPress }: DestinationCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: image }}
        style={styles.image}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        recyclingKey={image?.slice(-30)}
      />
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.gradient} />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>{country} · {hotelCount} hotels</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: rs(150),
    height: rs(190),
    borderRadius: rs(18),
    overflow: "hidden",
    marginRight: rs(12),
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: rs(100),
  },
  info: {
    position: "absolute",
    bottom: rs(12),
    left: rs(12),
    right: rs(12),
  },
  name: {
    fontSize: rf(16),
    fontWeight: "700" as const,
    color: "#fff",
  },
  detail: {
    fontSize: rf(11),
    color: "rgba(255,255,255,0.8)",
    marginTop: rs(2),
  },
});
