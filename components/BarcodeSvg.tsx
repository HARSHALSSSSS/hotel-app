import React, { useMemo } from "react";
import { View, Text, Platform } from "react-native";
import Svg, { Rect } from "react-native-svg";

const BAR_HEIGHT = 56;
const BAR_WIDTH = 2;

/**
 * Renders a unique barcode from a string (e.g. transaction ID).
 * Each character contributes to bar widths so the barcode is unique per value.
 */
export function BarcodeSvg({ value, width = 300, height = BAR_HEIGHT }: { value: string; width?: number; height?: number }) {
  const bars = useMemo(() => {
    const result: { x: number; w: number; fill: "black" | "white" }[] = [];
    let x = 0;
    const str = value || "0";
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const blackW = (Math.abs(code % 3) + 1) * BAR_WIDTH;
      const whiteW = BAR_WIDTH;
      result.push({ x, w: blackW, fill: "black" });
      x += blackW;
      result.push({ x, w: whiteW, fill: "white" });
      x += whiteW;
    }
    return result;
  }, [value]);

  const totalWidth = bars.reduce((s, b) => s + b.w, 0);

  return (
    <View style={{ width, alignItems: "center" }}>
      <View style={{ width, height }}>
        <Svg width={width} height={height} viewBox={`0 0 ${totalWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
          {bars.map((bar, i) => (
            <Rect key={i} x={bar.x} y={0} width={bar.w} height={height} fill={bar.fill} />
          ))}
        </Svg>
      </View>
      <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 6, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", letterSpacing: 1 }}>
        {value}
      </Text>
    </View>
  );
}
