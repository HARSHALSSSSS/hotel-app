import React from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

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
      <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={300} />
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
    width: 150,
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 12,
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
    height: 100,
  },
  info: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  detail: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
});
