export interface Hotel {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  description: string;
  pricePerNight: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  latitude: number;
  longitude: number;
  category: string;
  featured: boolean;
  rooms: Room[];
  reviews: Review[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  bedType: string;
  size: number;
  amenities: string[];
  image: string;
  available: boolean;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
}

export interface Booking {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelImage: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "booking" | "promo" | "system";
  read: boolean;
  createdAt: string;
}

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
];

const ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d955f3abe?w=800&q=80",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
];

const AVATAR_COLORS = ["#1B4B66", "#D4A853", "#10B981", "#EF4444", "#8B5CF6", "#F97316"];

export const CATEGORIES = [
  { id: "all", label: "All", icon: "grid-outline" as const },
  { id: "luxury", label: "Luxury", icon: "diamond-outline" as const },
  { id: "resort", label: "Resort", icon: "umbrella-outline" as const },
  { id: "boutique", label: "Boutique", icon: "flower-outline" as const },
  { id: "business", label: "Business", icon: "briefcase-outline" as const },
  { id: "beach", label: "Beach", icon: "water-outline" as const },
];

export const POPULAR_DESTINATIONS = [
  { id: "1", name: "Bali", country: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80", hotelCount: 234 },
  { id: "2", name: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80", hotelCount: 189 },
  { id: "3", name: "Maldives", country: "Maldives", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80", hotelCount: 156 },
  { id: "4", name: "Tokyo", country: "Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80", hotelCount: 312 },
  { id: "5", name: "Dubai", country: "UAE", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80", hotelCount: 178 },
];

function generateReviews(count: number): Review[] {
  const names = ["Alex M.", "Sarah K.", "James W.", "Emily R.", "Michael B.", "Lisa T.", "David C.", "Anna P."];
  const comments = [
    "Absolutely stunning hotel. The service was impeccable and the views were breathtaking.",
    "Great location and beautiful rooms. Would definitely come back again.",
    "The staff went above and beyond to make our stay memorable. Highly recommend!",
    "Perfect getaway spot. The amenities were top-notch and the food was delicious.",
    "Loved every moment of our stay. The pool area was particularly gorgeous.",
    "Clean, modern, and well-maintained. The breakfast buffet was excellent.",
    "A truly luxurious experience. The spa treatments were heavenly.",
    "Outstanding value for money. The room exceeded our expectations.",
  ];
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    reviews.push({
      id: `review-${i}`,
      userName: names[i % names.length],
      rating: 3.5 + Math.random() * 1.5,
      comment: comments[i % comments.length],
      date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      avatar: AVATAR_COLORS[i % AVATAR_COLORS.length],
    });
  }
  return reviews;
}

function generateRooms(basePrice: number): Room[] {
  return [
    {
      id: "room-standard",
      name: "Standard Room",
      description: "Comfortable room with modern amenities and city views",
      pricePerNight: basePrice,
      maxGuests: 2,
      bedType: "Queen Bed",
      size: 28,
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Mini Bar"],
      image: ROOM_IMAGES[0],
      available: true,
    },
    {
      id: "room-deluxe",
      name: "Deluxe Suite",
      description: "Spacious suite with separate living area and premium furnishings",
      pricePerNight: Math.round(basePrice * 1.6),
      maxGuests: 3,
      bedType: "King Bed",
      size: 45,
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Mini Bar", "Balcony", "Bathtub"],
      image: ROOM_IMAGES[1],
      available: true,
    },
    {
      id: "room-premium",
      name: "Premium Suite",
      description: "Luxurious suite with panoramic views and exclusive amenities",
      pricePerNight: Math.round(basePrice * 2.2),
      maxGuests: 4,
      bedType: "King Bed + Sofa Bed",
      size: 65,
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Mini Bar", "Balcony", "Bathtub", "Butler Service", "Lounge Access"],
      image: ROOM_IMAGES[2],
      available: true,
    },
    {
      id: "room-presidential",
      name: "Presidential Suite",
      description: "The ultimate luxury experience with private terrace and dedicated staff",
      pricePerNight: Math.round(basePrice * 3.5),
      maxGuests: 4,
      bedType: "King Bed",
      size: 120,
      amenities: ["Wi-Fi", "Air Conditioning", "TV", "Mini Bar", "Private Terrace", "Jacuzzi", "Butler Service", "Lounge Access", "Private Dining"],
      image: ROOM_IMAGES[3],
      available: Math.random() > 0.3,
    },
  ];
}

export const HOTELS: Hotel[] = [
  {
    id: "1",
    name: "The Grand Azure",
    location: "Seminyak, Bali",
    city: "Bali",
    country: "Indonesia",
    description: "Nestled along the pristine shores of Seminyak, The Grand Azure offers an unparalleled luxury experience. With its infinity pool overlooking the Indian Ocean, world-class spa, and exquisite dining options, every moment here is crafted for perfection.",
    pricePerNight: 320,
    originalPrice: 450,
    rating: 4.8,
    reviewCount: 2847,
    images: [HOTEL_IMAGES[0], HOTEL_IMAGES[1], HOTEL_IMAGES[2], HOTEL_IMAGES[3]],
    amenities: ["Pool", "Spa", "Restaurant", "Gym", "Beach Access", "Room Service", "Concierge", "Valet Parking"],
    latitude: -8.6910,
    longitude: 115.1670,
    category: "luxury",
    featured: true,
    rooms: generateRooms(320),
    reviews: generateReviews(6),
  },
  {
    id: "2",
    name: "Sakura Palace Hotel",
    location: "Shinjuku, Tokyo",
    city: "Tokyo",
    country: "Japan",
    description: "Experience the perfect blend of traditional Japanese hospitality and modern luxury at Sakura Palace. Located in the heart of Shinjuku, this hotel offers stunning city views, authentic cuisine, and easy access to Tokyo's best attractions.",
    pricePerNight: 275,
    originalPrice: 380,
    rating: 4.7,
    reviewCount: 1923,
    images: [HOTEL_IMAGES[4], HOTEL_IMAGES[5], HOTEL_IMAGES[6], HOTEL_IMAGES[7]],
    amenities: ["Pool", "Spa", "Restaurant", "Gym", "Business Center", "Room Service", "Laundry"],
    latitude: 35.6895,
    longitude: 139.6917,
    category: "business",
    featured: true,
    rooms: generateRooms(275),
    reviews: generateReviews(5),
  },
  {
    id: "3",
    name: "Maison Élégance",
    location: "Le Marais, Paris",
    city: "Paris",
    country: "France",
    description: "A charming boutique hotel in the historic Le Marais district. Maison Élégance combines Parisian elegance with contemporary comfort, featuring beautifully appointed rooms, a rooftop terrace, and personalized concierge services.",
    pricePerNight: 410,
    originalPrice: 520,
    rating: 4.9,
    reviewCount: 3156,
    images: [HOTEL_IMAGES[2], HOTEL_IMAGES[8], HOTEL_IMAGES[9], HOTEL_IMAGES[0]],
    amenities: ["Restaurant", "Bar", "Concierge", "Room Service", "Rooftop Terrace", "Wine Cellar"],
    latitude: 48.8566,
    longitude: 2.3522,
    category: "boutique",
    featured: true,
    rooms: generateRooms(410),
    reviews: generateReviews(8),
  },
  {
    id: "4",
    name: "Palm Cove Resort",
    location: "North Male Atoll, Maldives",
    city: "Maldives",
    country: "Maldives",
    description: "Escape to paradise at Palm Cove Resort. Overwater villas with glass floors, private beaches, and world-class diving make this the ultimate tropical retreat. Wake up to turquoise waters and fall asleep under the stars.",
    pricePerNight: 580,
    originalPrice: 750,
    rating: 4.9,
    reviewCount: 4201,
    images: [HOTEL_IMAGES[6], HOTEL_IMAGES[7], HOTEL_IMAGES[1], HOTEL_IMAGES[3]],
    amenities: ["Private Beach", "Diving Center", "Spa", "Water Sports", "Restaurant", "Overwater Bungalow", "Sunset Cruise"],
    latitude: 4.1755,
    longitude: 73.5093,
    category: "resort",
    featured: true,
    rooms: generateRooms(580),
    reviews: generateReviews(7),
  },
  {
    id: "5",
    name: "Burj Oasis Hotel",
    location: "Downtown, Dubai",
    city: "Dubai",
    country: "UAE",
    description: "Rising above the Dubai skyline, Burj Oasis offers unmatched luxury with panoramic views of the Burj Khalifa. Featuring an iconic rooftop infinity pool, Michelin-starred restaurants, and opulent suites.",
    pricePerNight: 490,
    originalPrice: 650,
    rating: 4.8,
    reviewCount: 2589,
    images: [HOTEL_IMAGES[8], HOTEL_IMAGES[9], HOTEL_IMAGES[4], HOTEL_IMAGES[5]],
    amenities: ["Infinity Pool", "Spa", "Restaurant", "Gym", "Helipad", "Butler Service", "Shopping Arcade"],
    latitude: 25.2048,
    longitude: 55.2708,
    category: "luxury",
    featured: false,
    rooms: generateRooms(490),
    reviews: generateReviews(6),
  },
  {
    id: "6",
    name: "Seaside Serenity",
    location: "Santorini, Greece",
    city: "Santorini",
    country: "Greece",
    description: "Perched on the caldera cliffs of Santorini, this boutique retreat offers breathtaking sunset views, cave-style suites, and authentic Greek hospitality. The perfect romantic getaway.",
    pricePerNight: 360,
    originalPrice: 480,
    rating: 4.7,
    reviewCount: 1876,
    images: [HOTEL_IMAGES[3], HOTEL_IMAGES[0], HOTEL_IMAGES[6], HOTEL_IMAGES[2]],
    amenities: ["Pool", "Restaurant", "Bar", "Spa", "Sunset Terrace", "Yacht Charter"],
    latitude: 36.3932,
    longitude: 25.4615,
    category: "boutique",
    featured: false,
    rooms: generateRooms(360),
    reviews: generateReviews(5),
  },
  {
    id: "7",
    name: "Alpine Lodge & Spa",
    location: "Zermatt, Switzerland",
    city: "Zermatt",
    country: "Switzerland",
    description: "A cozy mountain retreat at the foot of the Matterhorn. Alpine Lodge combines Swiss precision with warm hospitality, offering ski-in/ski-out access, a world-class spa, and fondue by the fireplace.",
    pricePerNight: 445,
    originalPrice: 560,
    rating: 4.6,
    reviewCount: 1543,
    images: [HOTEL_IMAGES[5], HOTEL_IMAGES[7], HOTEL_IMAGES[9], HOTEL_IMAGES[1]],
    amenities: ["Spa", "Restaurant", "Ski Access", "Fireplace", "Heated Pool", "Mountain Guide"],
    latitude: 46.0207,
    longitude: 7.7491,
    category: "resort",
    featured: false,
    rooms: generateRooms(445),
    reviews: generateReviews(4),
  },
  {
    id: "8",
    name: "Coral Bay Beach Hotel",
    location: "Phuket, Thailand",
    city: "Phuket",
    country: "Thailand",
    description: "Set on a private stretch of Phuket's finest beach, Coral Bay offers tropical luxury with Thai-inspired architecture. Enjoy beachfront dining, rejuvenating spa treatments, and vibrant nightlife nearby.",
    pricePerNight: 195,
    originalPrice: 280,
    rating: 4.5,
    reviewCount: 2134,
    images: [HOTEL_IMAGES[1], HOTEL_IMAGES[4], HOTEL_IMAGES[8], HOTEL_IMAGES[6]],
    amenities: ["Beach Access", "Pool", "Spa", "Restaurant", "Water Sports", "Kids Club"],
    latitude: 7.8804,
    longitude: 98.3923,
    category: "beach",
    featured: false,
    rooms: generateRooms(195),
    reviews: generateReviews(6),
  },
  {
    id: "9",
    name: "Manhattan Tower Suites",
    location: "Midtown, New York",
    city: "New York",
    country: "USA",
    description: "In the heart of Manhattan, this sleek business hotel offers sophisticated rooms with skyline views, state-of-the-art meeting facilities, and a rooftop cocktail bar that's become a city hotspot.",
    pricePerNight: 350,
    originalPrice: 420,
    rating: 4.6,
    reviewCount: 3421,
    images: [HOTEL_IMAGES[9], HOTEL_IMAGES[2], HOTEL_IMAGES[5], HOTEL_IMAGES[0]],
    amenities: ["Business Center", "Gym", "Rooftop Bar", "Restaurant", "Concierge", "Valet Parking"],
    latitude: 40.7580,
    longitude: -73.9855,
    category: "business",
    featured: false,
    rooms: generateRooms(350),
    reviews: generateReviews(7),
  },
  {
    id: "10",
    name: "Hacienda del Sol",
    location: "Tulum, Mexico",
    city: "Tulum",
    country: "Mexico",
    description: "An eco-luxury resort set among ancient Mayan ruins and pristine cenotes. Hacienda del Sol offers a unique blend of history, nature, and modern comfort with sustainable practices throughout.",
    pricePerNight: 240,
    originalPrice: 340,
    rating: 4.7,
    reviewCount: 1687,
    images: [HOTEL_IMAGES[7], HOTEL_IMAGES[3], HOTEL_IMAGES[0], HOTEL_IMAGES[8]],
    amenities: ["Pool", "Spa", "Restaurant", "Yoga Studio", "Cenote Access", "Eco Tours"],
    latitude: 20.2114,
    longitude: -87.4654,
    category: "beach",
    featured: false,
    rooms: generateRooms(240),
    reviews: generateReviews(5),
  },
];

export const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Booking Confirmed",
    message: "Your reservation at The Grand Azure has been confirmed for Dec 20-25.",
    type: "booking",
    read: false,
    createdAt: new Date(2025, 11, 15).toISOString(),
  },
  {
    id: "n2",
    title: "Flash Sale",
    message: "Up to 40% off on luxury resorts in Maldives. Book before midnight!",
    type: "promo",
    read: false,
    createdAt: new Date(2025, 11, 14).toISOString(),
  },
  {
    id: "n3",
    title: "Review Reminder",
    message: "How was your stay at Sakura Palace Hotel? Share your experience.",
    type: "system",
    read: true,
    createdAt: new Date(2025, 11, 10).toISOString(),
  },
  {
    id: "n4",
    title: "Price Drop Alert",
    message: "Maison Elegance in Paris dropped by 25%. Your saved hotel is now more affordable!",
    type: "promo",
    read: true,
    createdAt: new Date(2025, 11, 8).toISOString(),
  },
];
