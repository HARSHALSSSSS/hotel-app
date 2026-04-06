import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  TextInput,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";

type TabKey = "faq" | "contact";

const FAQ_CATEGORIES = ["All", "Services", "General", "Account"] as const;

const FAQ_ITEMS: { id: string; question: string; answer: string; category: string }[] = [
  {
    id: "1",
    question: "How do I schedule a Booking?",
    answer: "Open the app and browse hotels or use the search bar. Select a hotel, pick your room, choose check-in and check-out dates, enter guest details, select a payment method, and confirm your booking.",
    category: "Services",
  },
  {
    id: "2",
    question: "Can I cancel Booking?",
    answer: "Yes. Go to My Bookings, select your upcoming booking, tap Cancel and choose a reason. Refunds are processed per our policy.",
    category: "Services",
  },
  {
    id: "3",
    question: "How do I receive Booking Details?",
    answer: "After confirmation you’ll see the booking in My Bookings. You can open it for full details and E-Receipt.",
    category: "General",
  },
  {
    id: "4",
    question: "How to Checked Booking?",
    answer: "Open My Bookings from Profile. Upcoming shows confirmed stays; Completed shows past stays.",
    category: "General",
  },
  {
    id: "5",
    question: "How do I pay for Hotel Booking?",
    answer: "You can pay with Wallet, Card/UPI at checkout, or choose Pay on Arrival where available.",
    category: "Account",
  },
  {
    id: "6",
    question: "Is Voice call or Video Call Feature there?",
    answer: "Contact support via Help Center or in-app chat. Voice/video may be available for support in future.",
    category: "General",
  },
  {
    id: "7",
    question: "How to add review?",
    answer: "Go to My Bookings → Completed, tap Add Review on a stay. Rate and write your review.",
    category: "Account",
  },
];

const CONTACT_ITEMS: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap; detail?: string }[] = [
  { id: "1", label: "Customer Service", icon: "headset-outline" },
  { id: "2", label: "WhatsApp", icon: "logo-whatsapp", detail: "(480) 555-0103" },
  { id: "3", label: "Website", icon: "globe-outline", detail: "www.hotelbookinghub.com" },
  { id: "4", label: "Facebook", icon: "logo-facebook", detail: "Hotel Booking Hub" },
  { id: "5", label: "Twitter", icon: "logo-twitter", detail: "@HotelBookingHub" },
  { id: "6", label: "Instagram", icon: "logo-instagram", detail: "@hotelbookinghub" },
];

function FaqAccordionItem({
  item,
  expanded,
  onToggle,
}: {
  item: (typeof FAQ_ITEMS)[0];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.faqCard}>
      <Pressable style={styles.faqHeader} onPress={onToggle}>
        <Text style={styles.faqQuestion} numberOfLines={2}>{item.question}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={22}
          color={Colors.primary}
          style={styles.faqChevron}
        />
      </Pressable>
      {expanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
    </View>
  );
}

function ContactItem({
  item,
  expanded,
  onToggle,
}: {
  item: (typeof CONTACT_ITEMS)[0];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.contactCard}>
      <Pressable style={styles.contactRow} onPress={onToggle}>
        <View style={styles.contactLeft}>
          <View style={styles.contactIconWrap}>
            <Ionicons name={item.icon} size={24} color={Colors.primary} />
          </View>
          <Text style={styles.contactLabel}>{item.label}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={22}
          color={Colors.textTertiary}
        />
      </Pressable>
      {expanded && item.detail && (
        <View style={styles.contactDetail}>
          <View style={styles.contactBullet} />
          <Text style={styles.contactDetailText}>{item.detail}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>("faq");
  const [search, setSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState<string>("All");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);
  const [expandedContactId, setExpandedContactId] = useState<string | null>("2");
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredFaq = useMemo(() => {
    let list = FAQ_ITEMS.filter(
      (f) => faqCategory === "All" || f.category === faqCategory
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [faqCategory, search]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={Colors.primary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={styles.tab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab("faq");
          }}
        >
          <Text style={[styles.tabText, tab === "faq" && styles.tabTextActive]}>FAQ</Text>
          {tab === "faq" && <View style={styles.tabUnderline} />}
        </Pressable>
        <Pressable
          style={styles.tab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab("contact");
          }}
        >
          <Text style={[styles.tabText, tab === "contact" && styles.tabTextActive]}>Contact Us</Text>
          {tab === "contact" && <View style={styles.tabUnderline} />}
        </Pressable>
      </View>

      {tab === "faq" && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipScrollContent}
          >
            {FAQ_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, faqCategory === c && styles.chipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFaqCategory(c);
                }}
              >
                <Text style={[styles.chipText, faqCategory === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <FlatList
            data={filteredFaq}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.faqList, { paddingBottom: 24 + bottomInset }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <FaqAccordionItem
                item={item}
                expanded={expandedFaqId === item.id}
                onToggle={() =>
                  setExpandedFaqId((id) => (id === item.id ? null : item.id))
                }
              />
            )}
          />
        </>
      )}

      {tab === "contact" && (
        <FlatList
          data={CONTACT_ITEMS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.contactList, { paddingBottom: 24 + bottomInset }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ContactItem
              item={item}
              expanded={expandedContactId === item.id}
              onToggle={() =>
                setExpandedContactId((id) => (id === item.id ? null : item.id))
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center" as const,
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  headerSpacer: { width: 40 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text, paddingVertical: 12 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabText: { fontSize: 15, fontWeight: "500" as const, color: Colors.textSecondary },
  tabTextActive: { fontWeight: "700" as const, color: Colors.primary },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  chipScroll: { marginTop: 16, maxHeight: 44 },
  chipScrollContent: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row" as const },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 10,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: "500" as const, color: Colors.text },
  chipTextActive: { color: "#fff" },
  faqList: { padding: 20, paddingTop: 16 },
  faqCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: "600" as const, color: Colors.text, marginRight: 8 },
  faqChevron: {},
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  contactList: { padding: 20, paddingTop: 16 },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  contactLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { fontSize: 16, fontWeight: "600" as const, color: Colors.text },
  contactDetail: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 16,
  },
  contactBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  contactDetailText: { fontSize: 14, color: Colors.primary, fontWeight: "500" as const },
});
