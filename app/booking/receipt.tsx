import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { rs, rf } from "@/constants/responsive";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { formatPrice } from "@/lib/format-price";
import { BarcodeSvg } from "@/components/BarcodeSvg";

export default function ReceiptScreen() {
  const params = useLocalSearchParams<{
    bookingId: string;
    transactionId: string;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    guests: string;
    amount: string;
    taxesAndFees: string;
    total: string;
    guestName: string;
    guestPhone: string;
  }>();
  const insets = useSafeAreaInsets();
  const [downloading, setDownloading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const bookingDateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + " | " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const checkInStr = params.checkIn ? new Date(params.checkIn).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const checkOutStr = params.checkOut ? new Date(params.checkOut).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

  const transactionId = params.transactionId || `#RE${Date.now().toString(36).toUpperCase()}`;

  const handleDownload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDownloading(true);
    try {
      if (Platform.OS === "web") {
        Alert.alert("Download", "Use your browser's Print (Ctrl+P) to save as PDF, or take a screenshot to save the receipt.");
        setDownloading(false);
        return;
      }
      const Print = await import("expo-print").then((m) => m.default ?? m);
      const Sharing = await import("expo-sharing").then((m) => m.default ?? m);
      if (typeof Print?.printToFileAsync !== "function") {
        throw new Error("PDF generation is not supported. Take a screenshot to save the receipt.");
      }

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>E-Receipt</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; color: #1A1D21; }
  h1 { font-size: 22px; margin-bottom: 24px; }
  .barcode { font-family: monospace; letter-spacing: 2px; font-size: 14px; margin: 16px 0; }
  .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
  .label { color: #6B7280; }
  .value { font-weight: 600; }
  hr { border: none; border-top: 1px solid #E5E7EB; margin: 20px 0; }
  .total .value { font-size: 18px; font-weight: 800; }
</style>
</head>
<body>
  <h1>E-Receipt</h1>
  <div class="barcode">${transactionId}</div>
  <div class="row"><span class="label">Hotel Name</span><span class="value">${params.hotelName || ""}</span></div>
  <div class="row"><span class="label">Booking Date</span><span class="value">${bookingDateStr}</span></div>
  <div class="row"><span class="label">Check In</span><span class="value">${checkInStr}</span></div>
  <div class="row"><span class="label">Check Out</span><span class="value">${checkOutStr}</span></div>
  <div class="row"><span class="label">Guest</span><span class="value">${params.guests || ""} Person</span></div>
  <hr>
  <div class="row"><span class="label">Amount</span><span class="value">₹${String(params.amount || "0").replace(/,/g, "")}</span></div>
  <div class="row"><span class="label">Tax & Fees</span><span class="value">₹${String(params.taxesAndFees || "0").replace(/,/g, "")}</span></div>
  <div class="row total"><span class="label">Total</span><span class="value">₹${String(params.total || "0").replace(/,/g, "")}</span></div>
  <hr>
  <div class="row"><span class="label">Name</span><span class="value">${params.guestName || ""}</span></div>
  <div class="row"><span class="label">Phone Number</span><span class="value">${params.guestPhone || ""}</span></div>
  <div class="row"><span class="label">Transaction ID</span><span class="value">${transactionId}</span></div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing?.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Save E-Receipt" });
    } catch (e: any) {
      if (e?.message?.includes("shareAsync") || e?.code === "E_UNSUPPORTED") {
        Alert.alert("Download", "Sharing is not available on this device. You can take a screenshot to save the receipt.");
      } else {
        Alert.alert("Download", e?.message || "Could not generate receipt.");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>E-Receipt</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + bottomInset }]} showsVerticalScrollIndicator={false}>
        <View style={styles.barcodeWrap}>
          <BarcodeSvg value={transactionId} width={320} height={64} />
        </View>

        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Hotel Name</Text>
          <Text style={styles.detailValue}>{params.hotelName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booking Date</Text>
          <Text style={styles.detailValue}>{bookingDateStr}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Check In</Text>
          <Text style={styles.detailValue}>{checkInStr}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Check Out</Text>
          <Text style={styles.detailValue}>{checkOutStr}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Guest</Text>
          <Text style={styles.detailValue}>{params.guests} Person</Text>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>{formatPrice(parseFloat(String(params.amount ?? "0").replace(/,/g, "")) || 0)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tax & Fees</Text>
          <Text style={styles.detailValue}>{formatPrice(parseFloat(String(params.taxesAndFees ?? "0").replace(/,/g, "")) || 0)}</Text>
        </View>
        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(parseFloat(String(params.total ?? "0").replace(/,/g, "")) || 0)}</Text>
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Customer & Transaction</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name</Text>
          <Text style={styles.detailValue}>{params.guestName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone Number</Text>
          <Text style={styles.detailValue}>{params.guestPhone}</Text>
        </View>
        <View style={styles.transactionRow}>
          <Text style={styles.detailLabel}>Transaction ID</Text>
          <Text style={styles.transactionIdValue} selectable>{transactionId}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
        <Pressable style={[styles.downloadBtn, downloading && styles.downloadBtnDisabled]} onPress={handleDownload} disabled={downloading}>
          {downloading ? <ActivityIndicator color="#fff" /> : <Text style={styles.downloadBtnText}>Download E-Receipt</Text>}
        </Pressable>
        {params.bookingId ? (
          <Pressable style={styles.viewBookingBtn} onPress={() => router.replace({ pathname: "/booking/[id]", params: { id: params.bookingId } })}>
            <Text style={styles.viewBookingBtnText}>View Booking</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center" as const, fontSize: 18, fontWeight: "700" as const, color: Colors.text },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },
  barcodeWrap: { alignItems: "center", marginBottom: 28 },
  sectionTitle: { fontSize: 14, fontWeight: "700" as const, color: Colors.text, marginBottom: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 },
  detailLabel: { fontSize: 14, color: Colors.textSecondary, flexShrink: 0, minWidth: 120 },
  detailValue: { fontSize: 14, fontWeight: "600" as const, color: Colors.text, flex: 1, textAlign: "right" as const },
  transactionRow: { flexDirection: "column", marginBottom: 10, gap: 4 },
  transactionIdValue: { fontSize: 13, fontWeight: "600" as const, color: Colors.text, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 20 },
  totalRow: { marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "800" as const, color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: "800" as const, color: Colors.text },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: Colors.borderLight },
  downloadBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center", minHeight: 52, justifyContent: "center" },
  downloadBtnDisabled: { opacity: 0.8 },
  downloadBtnText: { fontSize: 16, fontWeight: "700" as const, color: "#fff" },
  viewBookingBtn: { marginTop: 12, paddingVertical: 14, alignItems: "center" },
  viewBookingBtnText: { fontSize: 16, fontWeight: "600" as const, color: Colors.primary },
});
