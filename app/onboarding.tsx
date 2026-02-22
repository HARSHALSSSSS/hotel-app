import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  useWindowDimensions,
  ScrollView,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { rs, rf, MIN_TOUCH } from "@/constants/responsive";
import { useApp } from "@/lib/app-context";

const SLIDES = [
  {
    key: "explore",
    title: "Explore, Compare, and Find ",
    titleHighlight: "the Perfect Hotel",
    body: "Discover thousands of hotels worldwide. Compare prices, read reviews, and book your ideal stay with ease.",
    mockup: "home",
  },
  {
    key: "bookmark",
    title: "Seamlessly ",
    titleHighlight: "Organize, Bookmark",
    body: "Save your favorite hotels and create lists for upcoming trips. Access your saved places anytime, anywhere.",
    mockup: "favorite",
  },
  {
    key: "schedule",
    title: "Schedule ",
    titleHighlight: "Your Hotel Stays in Advance",
    body: "Plan your travels ahead. Select check-in and check-out dates, choose your room, and confirm your reservation with a few taps.",
    mockup: "booking",
  },
  {
    key: "getstarted",
    title: "Redefining Your ",
    titleHighlight: "Hotel Reservation",
    titleHighlight2: " Experience",
    body: "Enjoy a seamless booking experience with instant confirmation, secure payments, and 24/7 support for your peace of mind.",
    mockup: "welcome",
  },
];

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80",
];

function PhoneMockup({
  children,
  width,
  height,
}: {
  children: React.ReactNode;
  width: number;
  height: number;
}) {
  return (
    <View style={[phoneStyles.frame, { width, height }]}>
      <View style={[phoneStyles.notch]} />
      <View style={phoneStyles.screen}>{children}</View>
    </View>
  );
}

const phoneStyles = StyleSheet.create({
  frame: {
    backgroundColor: "#1a1a1a",
    borderRadius: rs(28),
    padding: rs(8),
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  notch: {
    width: rs(72),
    height: rs(20),
    backgroundColor: "#1a1a1a",
    borderRadius: rs(10),
    alignSelf: "center",
    marginTop: -rs(2),
    marginBottom: rs(4),
  },
  screen: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: rs(20),
    overflow: "hidden",
  },
});

function HomeMockup() {
  return (
    <View style={mockupStyles.container}>
      <View style={mockupStyles.header}>
        <View style={mockupStyles.locationRow}>
          <Ionicons name="location" size={14} color={Colors.primary} />
          <Text style={mockupStyles.locationText}>New York, USA</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </View>
        <View style={mockupStyles.searchRow}>
          <View style={mockupStyles.searchBar}>
            <Ionicons name="search" size={14} color={Colors.textTertiary} />
            <Text style={mockupStyles.searchPlaceholder}>Search</Text>
          </View>
          <View style={mockupStyles.iconBtn}>
            <Ionicons name="notifications-outline" size={16} color={Colors.text} />
          </View>
          <View style={[mockupStyles.iconBtn, { backgroundColor: Colors.primary + "20" }]}>
            <Ionicons name="options-outline" size={16} color={Colors.primary} />
          </View>
        </View>
      </View>
      <View style={mockupStyles.section}>
        <Text style={mockupStyles.sectionTitle}>Recommended Hotel</Text>
        <Text style={mockupStyles.seeAll}>See all</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mockupStyles.hotelScroll}>
        {[
          { name: "OasisOverture", price: 650, img: HOTEL_IMAGES[0] },
          { name: "HiddenHaven", price: 550, img: HOTEL_IMAGES[1] },
          { name: "GoldenValley", price: 450, img: HOTEL_IMAGES[2] },
        ].map((h) => (
          <View key={h.name} style={mockupStyles.hotelCard}>
            <Image source={{ uri: h.img }} style={mockupStyles.hotelImg} contentFit="cover" />
            <View style={mockupStyles.discountTag}>
              <Text style={mockupStyles.discountText}>10% Off</Text>
            </View>
            <View style={mockupStyles.heartIcon}>
              <Ionicons name="heart" size={12} color={Colors.primary} />
            </View>
            <Text style={mockupStyles.hotelName}>{h.name}</Text>
            <View style={mockupStyles.metaRow}>
              <Ionicons name="star" size={10} color={Colors.star} />
              <Text style={mockupStyles.rating}>4.5</Text>
              <Ionicons name="location-outline" size={10} color={Colors.textSecondary} />
              <Text style={mockupStyles.locText}>New York, USA</Text>
            </View>
            <Text style={mockupStyles.price}>₹{h.price.toLocaleString("en-IN")} /night</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[mockupStyles.section, { marginTop: rs(8) }]}>
        <Text style={mockupStyles.sectionTitle}>Nearby Hotel</Text>
        <Text style={mockupStyles.seeAll}>See all</Text>
      </View>
      <View style={mockupStyles.hotelCard}>
        <Image source={{ uri: HOTEL_IMAGES[2] }} style={mockupStyles.hotelImg} contentFit="cover" />
        <View style={mockupStyles.discountTag}>
          <Text style={mockupStyles.discountText}>10% Off</Text>
        </View>
        <Text style={mockupStyles.hotelName}>GoldenValley</Text>
        <View style={mockupStyles.metaRow}>
          <Ionicons name="star" size={10} color={Colors.star} />
          <Text style={mockupStyles.rating}>4.9</Text>
        </View>
      </View>
    </View>
  );
}

function FavoriteMockup() {
  return (
    <View style={mockupStyles.container}>
      <View style={mockupStyles.favHeader}>
        <Ionicons name="arrow-back" size={18} color={Colors.text} />
        <Text style={mockupStyles.favTitle}>Favorite</Text>
        <Ionicons name="search" size={18} color={Colors.text} />
      </View>
      <View style={mockupStyles.pillsRow}>
        <View style={[mockupStyles.pill, mockupStyles.pillActive]}>
          <Text style={mockupStyles.pillTextActive}>All</Text>
        </View>
        <View style={mockupStyles.pill}>
          <Text style={mockupStyles.pillText}>Recommended</Text>
        </View>
        <View style={mockupStyles.pill}>
          <Text style={mockupStyles.pillText}>Popular</Text>
        </View>
      </View>
      {[
        { name: "GoldenValley", price: 150, img: HOTEL_IMAGES[2] },
        { name: "AlohaVista", price: 450, img: HOTEL_IMAGES[1] },
        { name: "HarborHaven Hideaway", price: 700, img: HOTEL_IMAGES[3] },
      ].map((h) => (
        <View key={h.name} style={mockupStyles.favCard}>
          <View style={mockupStyles.favCardImgWrap}>
            <Image source={{ uri: h.img }} style={mockupStyles.favCardImg} contentFit="cover" />
            <View style={mockupStyles.heartBadge}>
              <Ionicons name="heart" size={12} color="#fff" />
            </View>
          </View>
          <View style={mockupStyles.favCardBody}>
            <View style={mockupStyles.discountTagSmall}>
              <Text style={mockupStyles.discountText}>10% Off</Text>
            </View>
            <Text style={mockupStyles.hotelName} numberOfLines={1}>{h.name}</Text>
            <View style={mockupStyles.metaRow}>
              <Ionicons name="location-outline" size={10} color={Colors.textSecondary} />
              <Text style={mockupStyles.locText}>New York, USA</Text>
            </View>
            <View style={mockupStyles.priceRow}>
              <Text style={mockupStyles.price}>₹{h.price.toLocaleString("en-IN")}</Text>
              <Text style={mockupStyles.priceUnit}>/night</Text>
              <View style={mockupStyles.ratingBadge}>
                <Ionicons name="star" size={10} color={Colors.star} />
                <Text style={mockupStyles.rating}>4.9</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function BookingMockup() {
  return (
    <View style={mockupStyles.container}>
      <View style={mockupStyles.bookingHero}>
        <Image source={{ uri: HOTEL_IMAGES[3] }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={mockupStyles.discountBadge}>
          <Text style={mockupStyles.discountText}>10% Off</Text>
        </View>
      </View>
      <View style={mockupStyles.bookingBody}>
        <View style={mockupStyles.ratingRow}>
          <Ionicons name="star" size={12} color={Colors.star} />
          <Text style={mockupStyles.ratingText}>4.5 (365 reviews)</Text>
        </View>
        <Text style={mockupStyles.bookingHotelName}>HarborHaven Hideaway</Text>
        <Text style={mockupStyles.bookingAddress}>1012 Ocean avenue, New York, USA</Text>
        <Text style={mockupStyles.bookLabel}>BOOK HOTEL</Text>
        <Text style={mockupStyles.fieldLabel}>Check In</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[mockupStyles.dateBtn, mockupStyles.dateBtnActive]}>
            <Text style={mockupStyles.dateBtnTextActive}>Today 4 Oct</Text>
          </View>
          <View style={mockupStyles.dateBtn}><Text style={mockupStyles.dateBtnText}>Mon 5 Oct</Text></View>
          <View style={mockupStyles.dateBtn}><Text style={mockupStyles.dateBtnText}>Tue 6 Oct</Text></View>
        </ScrollView>
        <Text style={[mockupStyles.fieldLabel, { marginTop: rs(12) }]}>Check Out</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[mockupStyles.dateBtn, mockupStyles.dateBtnActive]}>
            <Text style={mockupStyles.dateBtnTextActive}>Sun 3 Nov</Text>
          </View>
          <View style={mockupStyles.dateBtn}><Text style={mockupStyles.dateBtnText}>Mon 4 Nov</Text></View>
          <View style={mockupStyles.dateBtn}><Text style={mockupStyles.dateBtnText}>Tue 5 Nov</Text></View>
        </ScrollView>
      </View>
    </View>
  );
}

function WelcomeMockup() {
  return (
    <View style={mockupStyles.welcomeContainer}>
      <View style={mockupStyles.welcomeCircles}>
        <Image source={{ uri: HOTEL_IMAGES[0] }} style={[mockupStyles.circleMain]} />
        <Image source={{ uri: HOTEL_IMAGES[1] }} style={[mockupStyles.circleLeft]} />
        <Image source={{ uri: HOTEL_IMAGES[3] }} style={[mockupStyles.circleRight]} />
      </View>
    </View>
  );
}

const mockupStyles = StyleSheet.create({
  container: { flex: 1, padding: rs(14) },
  header: { marginBottom: rs(8) },
  locationRow: { flexDirection: "row", alignItems: "center", gap: rs(4), marginBottom: rs(8) },
  locationText: { fontSize: rf(11), fontWeight: "600" as const, color: Colors.text },
  searchRow: { flexDirection: "row", alignItems: "center", gap: rs(6) },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: rs(6), backgroundColor: "#F0F1F3", borderRadius: rs(10), paddingHorizontal: rs(10), paddingVertical: rs(8) },
  searchPlaceholder: { fontSize: rf(11), color: Colors.textTertiary },
  iconBtn: { width: rs(28), height: rs(28), borderRadius: rs(8), backgroundColor: "#F0F1F3", alignItems: "center", justifyContent: "center" },
  section: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: rs(6) },
  sectionTitle: { fontSize: rf(11), fontWeight: "700" as const, color: Colors.text },
  seeAll: { fontSize: rf(10), color: Colors.primary, fontWeight: "600" as const },
  hotelScroll: { marginHorizontal: -rs(14) },
  hotelCard: { width: rs(86), marginRight: rs(8) },
  hotelImg: { width: rs(86), height: rs(58), borderRadius: rs(10) },
  discountTag: { position: "absolute", top: rs(4), left: rs(4), backgroundColor: "#EF4444", paddingHorizontal: rs(4), paddingVertical: rs(2), borderRadius: rs(4) },
  discountTagSmall: { alignSelf: "flex-start", backgroundColor: Colors.primary + "20", paddingHorizontal: rs(6), paddingVertical: rs(2), borderRadius: rs(6), marginBottom: rs(4) },
  discountBadge: { position: "absolute", top: rs(8), left: rs(8), backgroundColor: Colors.primary, paddingHorizontal: rs(8), paddingVertical: rs(4), borderRadius: rs(8) },
  discountText: { fontSize: rf(9), fontWeight: "700" as const, color: "#fff" },
  heartIcon: { position: "absolute", top: rs(4), right: rs(4), width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  hotelName: { fontSize: rf(11), fontWeight: "700" as const, color: Colors.text, marginTop: rs(4) },
  metaRow: { flexDirection: "row", alignItems: "center", gap: rs(4), marginTop: rs(2) },
  rating: { fontSize: rf(10), fontWeight: "600" as const, color: Colors.text },
  locText: { fontSize: rf(10), color: Colors.textSecondary },
  price: { fontSize: rf(11), fontWeight: "700" as const, color: Colors.primary, marginTop: rs(2) },
  priceUnit: { fontSize: rf(10), color: Colors.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: rs(2), marginTop: rs(4) },
  ratingBadge: { flexDirection: "row", alignItems: "center", marginLeft: "auto", gap: rs(2) },
  favHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: rs(10) },
  favTitle: { fontSize: rf(13), fontWeight: "700" as const, color: Colors.text },
  pillsRow: { flexDirection: "row", gap: rs(6), marginBottom: rs(12) },
  pill: { paddingHorizontal: rs(12), paddingVertical: rs(6), borderRadius: rs(20), backgroundColor: "#F0F1F3" },
  pillActive: { backgroundColor: Colors.primary },
  pillText: { fontSize: rf(10), color: Colors.textSecondary },
  pillTextActive: { fontSize: rf(10), fontWeight: "600" as const, color: "#fff" },
  favCard: { flexDirection: "row", marginBottom: rs(10), backgroundColor: "#F9FAFB", borderRadius: rs(12), overflow: "hidden" },
  favCardImgWrap: { position: "relative" },
  favCardImg: { width: rs(70), height: rs(70) },
  favCardBody: { flex: 1, padding: rs(8), justifyContent: "center" },
  heartBadge: { position: "absolute", top: rs(6), right: rs(6), width: rs(24), height: rs(24), borderRadius: rs(12), backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  bookingHero: { height: rs(72), borderRadius: rs(12), overflow: "hidden", position: "relative" },
  bookingBody: { paddingTop: rs(12) },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: rs(4) },
  ratingText: { fontSize: rf(11), color: Colors.textSecondary, fontWeight: "600" as const },
  bookingHotelName: { fontSize: rf(13), fontWeight: "800" as const, color: Colors.text, marginTop: rs(4) },
  bookingAddress: { fontSize: rf(10), color: Colors.textSecondary, marginTop: rs(2) },
  bookLabel: { fontSize: rf(10), fontWeight: "700" as const, color: Colors.textTertiary, letterSpacing: 0.5, marginTop: rs(12), marginBottom: rs(8) },
  fieldLabel: { fontSize: rf(11), fontWeight: "700" as const, color: Colors.text, marginBottom: rs(6) },
  dateBtn: { paddingHorizontal: rs(10), paddingVertical: rs(8), borderRadius: rs(10), backgroundColor: "#F0F1F3", marginRight: rs(6) },
  dateBtnActive: { backgroundColor: Colors.primary },
  dateBtnText: { fontSize: rf(10), color: Colors.text },
  dateBtnTextActive: { fontSize: rf(10), fontWeight: "600" as const, color: "#fff" },
  welcomeContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: rs(16) },
  welcomeCircles: { width: "100%", aspectRatio: 1, position: "relative", alignItems: "center", justifyContent: "center" },
  circleMain: { width: rs(160), height: rs(160), borderRadius: rs(80), position: "absolute" },
  circleLeft: { width: rs(72), height: rs(72), borderRadius: rs(36), position: "absolute", left: rs(8), top: rs(52) },
  circleRight: { width: rs(64), height: rs(64), borderRadius: rs(32), position: "absolute", right: rs(8), top: rs(18) },
});

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const phoneW = Math.min(width * 0.68, 260);
  const phoneH = Math.min(phoneW * 1.92, 500);

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding();
    router.replace("/auth/login");
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index < SLIDES.length - 1) {
      const next = index + 1;
      setIndex(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index > 0) {
      const prev = index - 1;
      setIndex(prev);
      flatListRef.current?.scrollToIndex({ index: prev, animated: true });
    }
  };

  const handleGetStarted = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeOnboarding();
    router.replace("/auth/register");
  };

  const handleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeOnboarding();
    router.replace("/auth/login");
  };

  const renderMockup = (mockupType: string) => {
    switch (mockupType) {
      case "home":
        return <HomeMockup />;
      case "favorite":
        return <FavoriteMockup />;
      case "booking":
        return <BookingMockup />;
      case "welcome":
        return <WelcomeMockup />;
      default:
        return <HomeMockup />;
    }
  };

  const renderSlide = ({ item, index: i }: { item: (typeof SLIDES)[0]; index: number }) => {
    const isLast = i === SLIDES.length - 1;
    const isFirst = i === 0;
    return (
      <View style={[styles.slide, { width }]}>
        <View style={styles.slideContent}>
          <PhoneMockup width={phoneW} height={phoneH}>
            {renderMockup(item.mockup)}
          </PhoneMockup>
          <View style={styles.textArea}>
            <Text style={styles.title} allowFontScaling={false}>
              {item.title}
              <Text style={styles.titleHighlight}>{item.titleHighlight}</Text>
              {item.titleHighlight2 ? <Text style={styles.title}>{item.titleHighlight2}</Text> : null}
            </Text>
            <Text style={styles.body} allowFontScaling={false}>{item.body}</Text>
          </View>
        </View>
        {isLast ? (
          <View style={[styles.actions, { paddingBottom: bottomInset + rs(28) }]}>
            <Pressable
              style={styles.getStartedBtn}
              onPress={handleGetStarted}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.getStartedText}>Let&apos;s Get Started</Text>
            </Pressable>
            <Pressable
              style={styles.signInLink}
              onPress={handleSignIn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.signInLinkText}>Already have an account? </Text>
              <Text style={styles.signInLinkBold}>Sign In</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.navRow, { paddingBottom: bottomInset + rs(28) }]}>
            <Pressable
              style={[
                styles.navBtn,
                isFirst ? styles.navBtnBackDisabled : styles.navBtnBack,
              ]}
              onPress={handlePrev}
              disabled={isFirst}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="chevron-back"
                size={rs(26)}
                color={isFirst ? Colors.textTertiary : Colors.primary}
              />
            </Pressable>
            <View style={styles.dots}>
              {SLIDES.map((_, di) => (
                <View
                  key={di}
                  style={[
                    styles.dot,
                    di === i && styles.dotActive,
                  ]}
                />
              ))}
            </View>
            <Pressable
              style={styles.navBtnForward}
              onPress={handleNext}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="chevron-forward"
                size={rs(26)}
                color="#fff"
              />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.skipBtn, { top: topInset + rs(12) }]}
        onPress={handleSkip}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        contentContainerStyle={styles.flatListContent}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(Math.min(i, SLIDES.length - 1));
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: false }), 100);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flatListContent: {
    flexGrow: 1,
  },
  skipBtn: {
    position: "absolute",
    right: rs(24),
    zIndex: 10,
    paddingVertical: rs(12),
    paddingHorizontal: rs(4),
  },
  skipText: {
    fontSize: rf(16),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: rs(20),
  },
  slideContent: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  textArea: {
    paddingHorizontal: rs(28),
    marginTop: rs(24),
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontSize: rf(22),
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    lineHeight: rf(30),
    letterSpacing: -0.3,
  },
  titleHighlight: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: rf(15),
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: rs(14),
    lineHeight: rf(23),
    letterSpacing: 0.1,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: rs(24),
    marginTop: rs(24),
    width: "100%",
    minHeight: rs(72),
  },
  navBtn: {
    width: Math.max(rs(52), MIN_TOUCH),
    height: Math.max(rs(52), MIN_TOUCH),
    borderRadius: Math.max(rs(26), MIN_TOUCH / 2),
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnBack: {
    backgroundColor: Colors.primary + "15",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  navBtnBackDisabled: {
    backgroundColor: "#F3F4F6",
    borderWidth: 0,
  },
  navBtnForward: {
    backgroundColor: Colors.primary,
    width: Math.max(rs(52), MIN_TOUCH),
    height: Math.max(rs(52), MIN_TOUCH),
    borderRadius: Math.max(rs(26), MIN_TOUCH / 2),
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
  },
  dot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: "#E5E7EB",
  },
  dotActive: {
    width: rs(22),
    backgroundColor: Colors.primary,
  },
  actions: {
    paddingHorizontal: rs(24),
    marginTop: rs(24),
    width: "100%",
    alignItems: "center",
  },
  getStartedBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: rs(16),
    paddingHorizontal: rs(32),
    borderRadius: rs(12),
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: MIN_TOUCH,
  },
  getStartedText: {
    fontSize: rf(17),
    fontWeight: "600" as const,
    color: "#fff",
  },
  signInLink: {
    flexDirection: "row",
    marginTop: rs(18),
    alignItems: "center",
    justifyContent: "center",
  },
  signInLinkText: {
    fontSize: rf(15),
    color: Colors.textSecondary,
  },
  signInLinkBold: {
    fontSize: rf(15),
    fontWeight: "600" as const,
    color: Colors.primary,
  },
});
