import { db, pool } from "./db";
import { hotels, rooms, users, reviews, notifications } from "@shared/schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

const HOTEL_IMAGES = {
  luxury: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  ],
  boutique: [
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d955f4bf4?w=800&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  ],
  resort: [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80",
    "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?w=800&q=80",
    "https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=800&q=80",
  ],
  business: [
    "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80",
    "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80",
    "https://images.unsplash.com/photo-1606402179428-a57976d71fa4?w=800&q=80",
    "https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=800&q=80",
  ],
};

const AMENITIES = {
  luxury: ["Free Wi-Fi", "Spa", "Pool", "Restaurant", "Bar", "Gym", "Concierge", "Room Service", "Valet Parking"],
  boutique: ["Free Wi-Fi", "Breakfast", "Rooftop Bar", "Library", "Bicycle Rental", "Garden"],
  resort: ["Free Wi-Fi", "Beach Access", "Pool", "Spa", "Water Sports", "Kids Club", "Tennis", "Restaurant"],
  business: ["Free Wi-Fi", "Business Center", "Conference Room", "Gym", "Restaurant", "Airport Shuttle"],
};

const hotelData = [
  { name: "The Ritz-Carlton", location: "Central Park South", city: "New York", country: "USA", price: 450, original: 599, rating: 4.9, reviewCount: 2841, lat: 40.7648, lng: -73.9808, category: "luxury", featured: true },
  { name: "Mandarin Oriental", location: "Columbus Circle", city: "New York", country: "USA", price: 520, original: 680, rating: 4.8, reviewCount: 1923, lat: 40.7693, lng: -73.9822, category: "luxury", featured: true },
  { name: "Four Seasons Resort", location: "Wailea Beach", city: "Maui", country: "USA", price: 780, original: 950, rating: 4.9, reviewCount: 3102, lat: 20.6896, lng: -156.4411, category: "resort", featured: true },
  { name: "Aman Tokyo", location: "Otemachi Tower", city: "Tokyo", country: "Japan", price: 850, original: 1100, rating: 4.9, reviewCount: 1456, lat: 35.6870, lng: 139.7632, category: "luxury", featured: true },
  { name: "Hotel Negresco", location: "Promenade des Anglais", city: "Nice", country: "France", price: 320, original: 420, rating: 4.7, reviewCount: 2104, lat: 43.6941, lng: 7.2597, category: "boutique", featured: true },
  { name: "Marina Bay Sands", location: "Bayfront Avenue", city: "Singapore", country: "Singapore", price: 390, original: 520, rating: 4.6, reviewCount: 5672, lat: 1.2834, lng: 103.8607, category: "luxury", featured: true },
  { name: "Burj Al Arab", location: "Jumeirah Beach", city: "Dubai", country: "UAE", price: 1200, original: 1500, rating: 4.9, reviewCount: 4021, lat: 25.1412, lng: 55.1852, category: "luxury", featured: true },
  { name: "Rosewood London", location: "High Holborn", city: "London", country: "UK", price: 480, original: 620, rating: 4.8, reviewCount: 1876, lat: 51.5177, lng: -0.1179, category: "boutique", featured: false },
  { name: "The Standard Bangkok", location: "Mahanakhon", city: "Bangkok", country: "Thailand", price: 180, original: 240, rating: 4.5, reviewCount: 1234, lat: 13.7235, lng: 100.5332, category: "boutique", featured: false },
  { name: "Waldorf Astoria", location: "Beverly Hills", city: "Los Angeles", country: "USA", price: 550, original: 720, rating: 4.8, reviewCount: 2567, lat: 34.0635, lng: -118.4115, category: "luxury", featured: false },
  { name: "Amanpuri Resort", location: "Pansea Beach", city: "Phuket", country: "Thailand", price: 680, original: 880, rating: 4.8, reviewCount: 987, lat: 7.9831, lng: 98.2819, category: "resort", featured: true },
  { name: "Park Hyatt Sydney", location: "The Rocks", city: "Sydney", country: "Australia", price: 410, original: 540, rating: 4.7, reviewCount: 1654, lat: -33.8563, lng: 151.2094, category: "business", featured: false },
  { name: "Belmond Copacabana", location: "Copacabana Beach", city: "Rio de Janeiro", country: "Brazil", price: 290, original: 380, rating: 4.6, reviewCount: 2103, lat: -22.9668, lng: -43.1789, category: "resort", featured: false },
  { name: "Claridge's", location: "Mayfair", city: "London", country: "UK", price: 620, original: 790, rating: 4.9, reviewCount: 3211, lat: 51.5074, lng: -0.1451, category: "luxury", featured: true },
  { name: "Oberoi Udaivilas", location: "Lake Pichola", city: "Udaipur", country: "India", price: 350, original: 460, rating: 4.8, reviewCount: 1890, lat: 24.5755, lng: 73.6788, category: "luxury", featured: false },
  { name: "Ace Hotel Kyoto", location: "Karasuma", city: "Kyoto", country: "Japan", price: 220, original: 290, rating: 4.5, reviewCount: 1102, lat: 34.9989, lng: 135.7585, category: "boutique", featured: false },
  { name: "W Barcelona", location: "Barceloneta Beach", city: "Barcelona", country: "Spain", price: 310, original: 410, rating: 4.6, reviewCount: 3456, lat: 41.3684, lng: 2.1897, category: "resort", featured: false },
  { name: "The Peninsula", location: "Tsim Sha Tsui", city: "Hong Kong", country: "China", price: 490, original: 640, rating: 4.8, reviewCount: 2678, lat: 22.2950, lng: 114.1722, category: "luxury", featured: false },
  { name: "Nobu Hotel", location: "Shoreditch", city: "London", country: "UK", price: 340, original: 440, rating: 4.5, reviewCount: 1543, lat: 51.5256, lng: -0.0782, category: "boutique", featured: false },
  { name: "Hilton Garden Inn", location: "Times Square", city: "New York", country: "USA", price: 180, original: 230, rating: 4.2, reviewCount: 4567, lat: 40.7580, lng: -73.9855, category: "business", featured: false },
  { name: "Conrad Maldives", location: "Rangali Island", city: "Maldives", country: "Maldives", price: 950, original: 1200, rating: 4.9, reviewCount: 2345, lat: 3.5421, lng: 72.5876, category: "resort", featured: true },
  { name: "Hotel Costes", location: "Rue Saint-Honoré", city: "Paris", country: "France", price: 480, original: 620, rating: 4.7, reviewCount: 1876, lat: 48.8657, lng: 2.3283, category: "boutique", featured: false },
  { name: "The Setai", location: "Collins Avenue", city: "Miami", country: "USA", price: 420, original: 560, rating: 4.7, reviewCount: 1923, lat: 25.7890, lng: -80.1301, category: "resort", featured: false },
  { name: "Shangri-La", location: "The Shard", city: "London", country: "UK", price: 530, original: 690, rating: 4.8, reviewCount: 2190, lat: 51.5045, lng: -0.0865, category: "luxury", featured: false },
];

const ROOM_TYPES = [
  { name: "Deluxe Room", bed: "King", size: 35, basePrice: 1.0 },
  { name: "Superior Suite", bed: "King", size: 55, basePrice: 1.5 },
  { name: "Executive Suite", bed: "King", size: 75, basePrice: 2.0 },
  { name: "Standard Double", bed: "Double", size: 28, basePrice: 0.8 },
  { name: "Family Room", bed: "Twin + Sofa", size: 50, basePrice: 1.3 },
];

const reviewComments = [
  "Absolutely stunning property. The service was impeccable and the room was gorgeous.",
  "Great location and beautiful rooms. The breakfast buffet was exceptional.",
  "One of the best hotels I have ever stayed at. Will definitely return.",
  "The staff went above and beyond to make our stay memorable. Highly recommended.",
  "Beautiful hotel with amazing views. The spa was a highlight of our trip.",
  "Excellent value for the price. Clean, modern and comfortable.",
  "The pool area was fantastic. Rooms were spacious and well-appointed.",
  "Perfect for a romantic getaway. The attention to detail is remarkable.",
  "Good hotel but a bit overpriced for what you get. Still a pleasant stay.",
  "The restaurant on site was world-class. Room service was prompt and delicious.",
  "Loved every moment of our stay. The concierge was incredibly helpful.",
  "A truly luxurious experience from check-in to check-out.",
];

const reviewerNames = [
  "Alexandra M.", "James W.", "Sophia L.", "Michael R.", "Emma T.",
  "David K.", "Olivia S.", "William H.", "Isabella C.", "Benjamin F.",
  "Charlotte D.", "Ethan P.", "Amelia B.", "Lucas G.", "Mia N.",
];

async function seed() {
  console.log("Starting database seed...");

  const existing = await db.select({ id: hotels.id }).from(hotels).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded, skipping.");
    await pool.end();
    return;
  }

  const hashedPassword = await bcrypt.hash("demo123", 12);
  const [demoUser] = await db.insert(users).values({
    email: "demo@stayease.com",
    username: "demouser",
    password: hashedPassword,
    name: "Demo User",
    isVerified: true,
    role: "user",
    walletBalance: 500,
  }).returning();

  console.log(`Created demo user: ${demoUser.email}`);

  for (const h of hotelData) {
    const cat = h.category as keyof typeof HOTEL_IMAGES;
    const images = HOTEL_IMAGES[cat] || HOTEL_IMAGES.luxury;
    const amenities = AMENITIES[cat] || AMENITIES.luxury;

    const [hotel] = await db.insert(hotels).values({
      name: h.name,
      location: h.location,
      city: h.city,
      country: h.country,
      description: `Experience world-class hospitality at ${h.name}, located in the heart of ${h.city}. This ${h.category} property offers an unforgettable stay with premium amenities, exceptional dining, and personalized service. Whether you're traveling for business or leisure, ${h.name} provides the perfect base for exploring ${h.city}.`,
      pricePerNight: h.price,
      originalPrice: h.original,
      rating: h.rating,
      reviewCount: h.reviewCount,
      images,
      amenities,
      latitude: h.lat,
      longitude: h.lng,
      category: h.category,
      featured: h.featured,
      isActive: true,
    }).returning();

    const roomTypes = ROOM_TYPES.slice(0, 3 + Math.floor(Math.random() * 2));
    for (const rt of roomTypes) {
      await db.insert(rooms).values({
        hotelId: hotel.id,
        name: rt.name,
        description: `Spacious ${rt.name.toLowerCase()} featuring a ${rt.bed.toLowerCase()} bed, ${rt.size}sqm of living space, and premium amenities. Enjoy complimentary Wi-Fi, a minibar, and daily housekeeping.`,
        pricePerNight: Math.round(h.price * rt.basePrice),
        maxGuests: rt.bed === "Twin + Sofa" ? 4 : 2,
        bedType: rt.bed,
        size: rt.size,
        amenities: ["Wi-Fi", "Minibar", "Safe", "Air Conditioning", "TV", "Coffee Machine"],
        available: true,
        totalRooms: 3 + Math.floor(Math.random() * 8),
      });
    }

    const numReviews = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numReviews; i++) {
      const rating = Math.max(3, Math.min(5, h.rating - 0.5 + Math.random()));
      await db.insert(reviews).values({
        userId: demoUser.id,
        hotelId: hotel.id,
        rating: Math.round(rating * 10) / 10,
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      });
    }

    console.log(`Seeded: ${hotel.name}`);
  }

  await db.insert(notifications).values([
    {
      userId: demoUser.id,
      title: "Welcome to StayEase",
      message: "Start exploring amazing hotels around the world. Your next adventure awaits!",
      type: "system",
    },
    {
      userId: demoUser.id,
      title: "New Year Deals",
      message: "Get up to 40% off on luxury hotels worldwide. Limited time offer!",
      type: "promotion",
    },
  ]);

  console.log(`Seed complete! ${hotelData.length} hotels with rooms, reviews, and notifications.`);
  await pool.end();
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  pool.end();
  process.exit(1);
});
