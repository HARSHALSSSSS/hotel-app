import "dotenv/config";
import { db, pool } from "./db";
import { hotels, rooms, users, reviews, notifications, bookings, transactions, favorites } from "@shared/schema";
import bcrypt from "bcryptjs";
import { sql, eq } from "drizzle-orm";

const FORCE = process.argv.includes("--force");

// Legacy category pools (kept for reference; seed now uses ALL_HOTEL_IMAGES)
const _HOTEL_IMAGES_LEGACY = {
  luxury: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d955f4bf4?w=800&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    "https://images.unsplash.com/photo-1522583516311-4710d43739d7?w=800&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
    "https://images.unsplash.com/photo-1596436889106-be42e506efd3?w=800&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80",
    "https://images.unsplash.com/photo-1575699512300-5cd8d337d7e2?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d955f4bf4?w=800&q=80",
  ],
  boutique: [
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d955f4bf4?w=800&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
    "https://images.unsplash.com/photo-1596436889106-be42e506efd3?w=800&q=80",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
    "https://images.unsplash.com/photo-1522583516311-4710d43739d7?w=800&q=80",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  ],
  resort: [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80",
    "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?w=800&q=80",
    "https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=800&q=80",
    "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    "https://images.unsplash.com/photo-1559827260-dc66d43bef33?w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d955f4bf4?w=800&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
    "https://images.unsplash.com/photo-1596436889106-be42e506efd3?w=800&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
  ],
  business: [
    "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80",
    "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80",
    "https://images.unsplash.com/photo-1606402179428-a57976d71fa4?w=800&q=80",
    "https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=800&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d955f4bf4?w=800&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    "https://images.unsplash.com/photo-1522583516311-4710d43739d7?w=800&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
    "https://images.unsplash.com/photo-1596436889106-be42e506efd3?w=800&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
    "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
  ],
  beach: [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    "https://images.unsplash.com/photo-1559827260-dc66d43bef33?w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80",
    "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?w=800&q=80",
    "https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=800&q=80",
    "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80",
    "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80",
    "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    "https://images.unsplash.com/photo-1559827260-dc66d43bef33?w=800&q=80",
    "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d955f4bf4?w=800&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  ],
};

// 40+ unique images per category so each of 35 hotels gets different images
const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;
const ROOM_IMAGES = [
  IMG("1566073771259-6a8506099945"), IMG("1582719508461-905c673771fd"), IMG("1542314831-068cd1dbfeeb"),
  IMG("1590490360182-c33d955f4bf4"), IMG("1578683010236-d716f9a3f461"), IMG("1564501049412-61c2a3083791"),
  IMG("1596436889106-be42e506efd3"), IMG("1512918728675-ed5a9ecdebfd"), IMG("1551882547-ff40c63fe5fa"),
  IMG("1566665797739-1674de7a421a"), IMG("1571003123894-1f0594d2b5d9"), IMG("1584132967334-10e028bd69f7"),
  IMG("1611892440504-42a792e24d32"), IMG("1631049307264-da0ec9d70304"), IMG("1575699512300-5cd8d337d7e2"),
  IMG("1522583516311-4710d43739d7"), IMG("1445019980597-93fa8acb246c"), IMG("1606402179428-a57976d71fa4"),
  IMG("1496417263034-38ec4f0b665a"), IMG("1590073242678-70ee3fc28f8e"), IMG("1600047509782-20d43209fddd"),
  IMG("1600566752355-35792bedcfea"), IMG("1600585154340-be6161a56a0c"), IMG("1600573472592-401b489a3cdc"),
  IMG("1600596542815-ffad4c1539a9"), IMG("1600566753086-00f18fb6b3ea"), IMG("1600210492486-724fe5c67fb0"),
  IMG("1600563438938-a650a3cb3b65"), IMG("1600607687939-ce8a6c25118c"), IMG("1520250497591-112f2f40a3f4"),
  IMG("1582719478250-c89cae9f5b6e"), IMG("1493809842364-78817add7ffb"), IMG("1540518614846-7eded433c457"),
  IMG("1505693416388-ac5ce068fe85"), IMG("1618773928121-c32242e63f39"), IMG("1631049035182-249067d7618e"),
  IMG("1591088398332-8a7791972843"), IMG("1595576508898-0ad5c879a061"), IMG("1414235077428-338989a2e8b0"),
  IMG("1550966871-3ed5cd31c52e"), IMG("1517248135467-4c7edcad34c4"),
];
const BED_IMAGES = [
  IMG("1522771739844-6a9f6d5f14af"), IMG("1618773928121-c32242e63f39"), IMG("1631049307264-da0ec9d70304"),
  IMG("1631049035182-249067d7618e"), IMG("1505693416388-ac5ce068fe85"), IMG("1591088398332-8a7791972843"),
  IMG("1595576508898-0ad5c879a061"), IMG("1584132967334-10e028bd69f7"), IMG("1611892440504-42a792e24d32"),
  IMG("1571003123894-1f0594d2b5d9"), IMG("1566665797739-1674de7a421a"), IMG("1596436889106-be42e506efd3"),
  IMG("1578683010236-d716f9a3f461"), IMG("1564501049412-61c2a3083791"), IMG("1590490360182-c33d955f4bf4"),
  IMG("1542314831-068cd1dbfeeb"), IMG("1582719508461-905c673771fd"), IMG("1566073771259-6a8506099945"),
  IMG("1522583516311-4710d43739d7"), IMG("1445019980597-93fa8acb246c"), IMG("1551882547-ff40c63fe5fa"),
  IMG("1512918728675-ed5a9ecdebfd"), IMG("1575699512300-5cd8d337d7e2"), IMG("1606402179428-a57976d71fa4"),
  IMG("1496417263034-38ec4f0b665a"), IMG("1590073242678-70ee3fc28f8e"), IMG("1600566752355-35792bedcfea"),
  IMG("1600585154340-be6161a56a0c"), IMG("1600573472592-401b489a3cdc"), IMG("1600596542815-ffad4c1539a9"),
  IMG("1600047509782-20d43209fddd"), IMG("1600566753086-00f18fb6b3ea"), IMG("1600210492486-724fe5c67fb0"),
  IMG("1600563438938-a650a3cb3b65"), IMG("1600607687939-ce8a6c25118c"), IMG("1520250497591-112f2f40a3f4"),
  IMG("1582719478250-c89cae9f5b6e"), IMG("1493809842364-78817add7ffb"), IMG("1540518614846-7eded433c457"),
  IMG("1455587734955-081b22074882"), IMG("1414235077428-338989a2e8b0"),
];
const POOL_IMAGES = [
  IMG("1571896349842-33c89424de2d"), IMG("1540541338287-41700207dee6"), IMG("1586375300773-8384e3e4916f"),
  IMG("1514282401047-d79a71a590e8"), IMG("1507525428034-b723cf961d3e"), IMG("1573052905904-34ad8c27f0cc"),
  IMG("1559827260-dc66d43bef33"), IMG("1506953823976-52e1fdc0149a"), IMG("1519046904884-53103b34b206"),
  IMG("1505142468610-359e7d316be0"), IMG("1540202404-a2f29016b523"), IMG("1566073771259-6a8506099945"),
  IMG("1582719508461-905c673771fd"), IMG("1578683010236-d716f9a3f461"), IMG("1590490360182-c33d955f4bf4"),
  IMG("1564501049412-61c2a3083791"), IMG("1520250497591-112f2f40a3f4"), IMG("1445019980597-93fa8acb246c"),
  IMG("1631049307264-da0ec9d70304"), IMG("1591088398332-8a7791972843"), IMG("1595576508898-0ad5c879a061"),
  IMG("1611892440504-42a792e24d32"), IMG("1606402179428-a57976d71fa4"), IMG("1496417263034-38ec4f0b665a"),
  IMG("1590073242678-70ee3fc28f8e"), IMG("1600566752355-35792bedcfea"), IMG("1600585154340-be6161a56a0c"),
  IMG("1600573472592-401b489a3cdc"), IMG("1600596542815-ffad4c1539a9"), IMG("1600047509782-20d43209fddd"),
  IMG("1600566753086-00f18fb6b3ea"), IMG("1600210492486-724fe5c67fb0"), IMG("1600563438938-a650a3cb3b65"),
  IMG("1600607687939-ce8a6c25118c"), IMG("1582719478250-c89cae9f5b6e"), IMG("1493809842364-78817add7ffb"),
  IMG("1540518614846-7eded433c457"), IMG("1542314831-068cd1dbfeeb"), IMG("1551882547-ff40c63fe5fa"),
  IMG("1566665797739-1674de7a421a"), IMG("1571003123894-1f0594d2b5d9"),
];
const DINING_IMAGES = [
  IMG("1414235077428-338989a2e8b0"), IMG("1550966871-3ed5cd31c52e"), IMG("1517248135467-4c7edcad34c4"),
  IMG("1555396273-367ea4eb4db5"), IMG("1559339352-11d03551965d"), IMG("1552566626-52f8b828add9"),
  IMG("1424847651672-bf20bd8ef16c"), IMG("1566073771259-6a8506099945"), IMG("1582719508461-905c673771fd"),
  IMG("1542314831-068cd1dbfeeb"), IMG("1590490360182-c33d955f4bf4"), IMG("1578683010236-d716f9a3f461"),
  IMG("1564501049412-61c2a3083791"), IMG("1596436889106-be42e506efd3"), IMG("1520250497591-112f2f40a3f4"),
  IMG("1445019980597-93fa8acb246c"), IMG("1522583516311-4710d43739d7"), IMG("1551882547-ff40c63fe5fa"),
  IMG("1566665797739-1674de7a421a"), IMG("1571003123894-1f0594d2b5d9"), IMG("1584132967334-10e028bd69f7"),
  IMG("1611892440504-42a792e24d32"), IMG("1631049307264-da0ec9d70304"), IMG("1591088398332-8a7791972843"),
  IMG("1595576508898-0ad5c879a061"), IMG("1575699512300-5cd8d337d7e2"), IMG("1571896349842-33c89424de2d"),
  IMG("1540541338287-41700207dee6"), IMG("1586375300773-8384e3e4916f"), IMG("1514282401047-d79a71a590e8"),
  IMG("1507525428034-b723cf961d3e"), IMG("1573052905904-34ad8c27f0cc"), IMG("1559827260-dc66d43bef33"),
  IMG("1506953823976-52e1fdc0149a"), IMG("1606402179428-a57976d71fa4"), IMG("1496417263034-38ec4f0b665a"),
  IMG("1590073242678-70ee3fc28f8e"), IMG("1600566752355-35792bedcfea"), IMG("1600585154340-be6161a56a0c"),
  IMG("1600573472592-401b489a3cdc"), IMG("1600596542815-ffad4c1539a9"), IMG("1600047509782-20d43209fddd"),
];
const AREA_IMAGES = [
  IMG("1520250497591-112f2f40a3f4"), IMG("1445019980597-93fa8acb246c"), IMG("1582719478250-c89cae9f5b6e"),
  IMG("1493809842364-78817add7ffb"), IMG("1540518614846-7eded433c457"), IMG("1600585154340-be6161a56a0c"),
  IMG("1566073771259-6a8506099945"), IMG("1582719508461-905c673771fd"), IMG("1542314831-068cd1dbfeeb"),
  IMG("1590490360182-c33d955f4bf4"), IMG("1578683010236-d716f9a3f461"), IMG("1564501049412-61c2a3083791"),
  IMG("1596436889106-be42e506efd3"), IMG("1522583516311-4710d43739d7"), IMG("1551882547-ff40c63fe5fa"),
  IMG("1566665797739-1674de7a421a"), IMG("1571003123894-1f0594d2b5d9"), IMG("1584132967334-10e028bd69f7"),
  IMG("1611892440504-42a792e24d32"), IMG("1631049307264-da0ec9d70304"), IMG("1591088398332-8a7791972843"),
  IMG("1595576508898-0ad5c879a061"), IMG("1575699512300-5cd8d337d7e2"), IMG("1571896349842-33c89424de2d"),
  IMG("1540541338287-41700207dee6"), IMG("1586375300773-8384e3e4916f"), IMG("1514282401047-d79a71a590e8"),
  IMG("1507525428034-b723cf961d3e"), IMG("1573052905904-34ad8c27f0cc"), IMG("1559827260-dc66d43bef33"),
  IMG("1506953823976-52e1fdc0149a"), IMG("1606402179428-a57976d71fa4"), IMG("1496417263034-38ec4f0b665a"),
  IMG("1590073242678-70ee3fc28f8e"), IMG("1600566752355-35792bedcfea"), IMG("1600585154340-be6161a56a0c"),
  IMG("1600573472592-401b489a3cdc"), IMG("1600596542815-ffad4c1539a9"), IMG("1600047509782-20d43209fddd"),
  IMG("1600566753086-00f18fb6b3ea"), IMG("1600210492486-724fe5c67fb0"), IMG("1600563438938-a650a3cb3b65"),
  IMG("1600607687939-ce8a6c25118c"), IMG("1455587734955-081b22074882"),
];

/** Each hotel gets 6 distinct images; hotelIndex maps to unique indices so no two hotels share the same set */
function getUniqueImagesForHotel(hotelIndex: number): string[] {
  const n = hotelIndex;
  return [
    ROOM_IMAGES[n % ROOM_IMAGES.length],
    BED_IMAGES[n % BED_IMAGES.length],
    POOL_IMAGES[n % POOL_IMAGES.length],
    DINING_IMAGES[n % DINING_IMAGES.length],
    AREA_IMAGES[n % AREA_IMAGES.length],
    ROOM_IMAGES[(n + 17) % ROOM_IMAGES.length],
  ];
}

const AMENITIES = {
  luxury: ["Free Wi-Fi", "Spa", "Pool", "Restaurant", "Bar", "Gym", "Concierge", "Room Service", "Valet Parking"],
  boutique: ["Free Wi-Fi", "Breakfast", "Rooftop Bar", "Library", "Bicycle Rental", "Garden"],
  resort: ["Free Wi-Fi", "Beach Access", "Pool", "Spa", "Water Sports", "Kids Club", "Tennis", "Restaurant"],
  business: ["Free Wi-Fi", "Business Center", "Conference Room", "Gym", "Restaurant", "Airport Shuttle"],
  beach: ["Free Wi-Fi", "Beach Access", "Pool", "Water Sports", "Beach Bar", "Sun Loungers", "Restaurant"],
};

// All hotels in India – prices in INR (₹), each with a unique description
const hotelData: { name: string; location: string; city: string; country: string; price: number; original: number; rating: number; reviewCount: number; lat: number; lng: number; category: string; featured: boolean; description: string }[] = [
  { name: "The Ritz-Carlton", location: "Powai Lake", city: "Mumbai", country: "India", price: 37500, original: 49900, rating: 4.9, reviewCount: 2841, lat: 19.1197, lng: 72.9081, category: "luxury", featured: true, description: "Overlooking serene Powai Lake, The Ritz-Carlton Mumbai blends timeless luxury with modern comforts. Indulge in award-winning dining, a world-class spa, and rooftop infinity pools. Perfect for both business travelers and couples seeking an escape in India's financial capital." },
  { name: "Mandarin Oriental", location: "BKC", city: "Mumbai", country: "India", price: 43000, original: 56500, rating: 4.8, reviewCount: 1923, lat: 19.0614, lng: 72.8656, category: "luxury", featured: true, description: "Rising in the heart of Bandra Kurla Complex, Mandarin Oriental Mumbai offers refined hospitality with contemporary design. Experience innovative cuisine, a rooftop bar with city views, and impeccable service for the discerning traveler." },
  { name: "Four Seasons Resort", location: "Cavelossim Beach", city: "Goa", country: "India", price: 65000, original: 79000, rating: 4.9, reviewCount: 3102, lat: 15.1763, lng: 73.9529, category: "resort", featured: true, description: "Set on pristine Cavelossim Beach, Four Seasons Resort Goa delivers tropical paradise with private villas, a lagoon-style pool, and authentic Goan spa rituals. Ideal for honeymoons and families seeking sun, sand, and luxury." },
  { name: "Aman Tokyo", location: "DLF Cyber City", city: "Gurugram", country: "India", price: 71000, original: 91500, rating: 4.9, reviewCount: 1456, lat: 28.4952, lng: 77.0885, category: "luxury", featured: true, description: "In the heart of Gurugram's business district, Aman Tokyo brings minimalist Japanese elegance to India. Tranquil gardens, a serene spa, and rooftop dining create a sanctuary above the bustling city." },
  { name: "Hotel Negresco", location: "MG Road", city: "Bengaluru", country: "India", price: 26500, original: 34900, rating: 4.7, reviewCount: 2104, lat: 12.9716, lng: 77.5946, category: "boutique", featured: true, description: "A charming boutique retreat on MG Road, Hotel Negresco combines old-world charm with Bangalore's tech-forward spirit. Art-filled interiors, a cozy rooftop café, and personalized service await." },
  { name: "Marina Bay Sands", location: "Marina Beach", city: "Chennai", country: "India", price: 32500, original: 43200, rating: 4.6, reviewCount: 5672, lat: 13.0827, lng: 80.2707, category: "luxury", featured: true, description: "Steps from Marina Beach, Marina Bay Sands Chennai offers waterfront luxury with infinity pools, multiple restaurants, and a rooftop sky park. A landmark for leisure and business travelers alike." },
  { name: "Burj Al Arab", location: "Banjara Hills", city: "Hyderabad", country: "India", price: 99500, original: 124500, rating: 4.9, reviewCount: 4021, lat: 17.4239, lng: 78.4738, category: "luxury", featured: true, description: "An icon of opulence in Banjara Hills, Burj Al Arab Hyderabad redefines luxury with butler service, gold-leaf finishes, and panoramic city views. A once-in-a-lifetime stay for the ultimate indulgence." },
  { name: "Rosewood London", location: "Koregaon Park", city: "Pune", country: "India", price: 40000, original: 51500, rating: 4.8, reviewCount: 1876, lat: 18.5314, lng: 73.8446, category: "boutique", featured: false, description: "Nestled in vibrant Koregaon Park, Rosewood London blends urban chic with boutique intimacy. Café culture, art galleries, and designer shops surround this stylish hideaway." },
  { name: "The Standard Bangkok", location: "MG Road", city: "Kochi", country: "India", price: 15000, original: 19900, rating: 4.5, reviewCount: 1234, lat: 9.9312, lng: 76.2673, category: "boutique", featured: false, description: "A budget-friendly boutique gem on Kochi's MG Road. The Standard Bangkok offers cozy rooms, local Keralan flavours, and easy access to backwaters and the historic Fort Kochi area." },
  { name: "Waldorf Astoria", location: "Connaught Place", city: "New Delhi", country: "India", price: 45500, original: 59800, rating: 4.8, reviewCount: 2567, lat: 28.6304, lng: 77.2177, category: "luxury", featured: false, description: "In the heart of Connaught Place, Waldorf Astoria New Delhi embodies classic grandeur. High tea, fine dining, and heritage architecture make it a landmark of Indian hospitality." },
  { name: "Amanpuri Resort", location: "Varkala Cliff", city: "Thiruvananthapuram", country: "India", price: 56500, original: 73000, rating: 4.8, reviewCount: 987, lat: 8.7376, lng: 76.7163, category: "resort", featured: true, description: "Perched on Varkala's dramatic cliff, Amanpuri Resort offers Ayurvedic wellness, cliff-edge infinity pools, and pristine beaches. A spiritual retreat with world-class comfort." },
  { name: "Park Hyatt Sydney", location: "Park Street", city: "Kolkata", country: "India", price: 34000, original: 44900, rating: 4.7, reviewCount: 1654, lat: 22.5726, lng: 88.3639, category: "business", featured: false, description: "On Kolkata's iconic Park Street, Park Hyatt Sydney delivers sleek business travel with rooftop meetings, a pool, and easy access to the city's cultural and commercial hub." },
  { name: "Belmond Copacabana", location: "Backwaters", city: "Alleppey", country: "India", price: 24000, original: 31500, rating: 4.6, reviewCount: 2103, lat: 9.4981, lng: 76.3388, category: "resort", featured: false, description: "Float through Kerala's backwaters aboard Belmond Copacabana's houseboats. Wake to misty mornings, feast on Keralan cuisine, and drift past coconut groves and village life." },
  { name: "Claridge's", location: "Rajpath", city: "New Delhi", country: "India", price: 51500, original: 65600, rating: 4.9, reviewCount: 3211, lat: 28.6139, lng: 77.2090, category: "luxury", featured: true, description: "Along Delhi's grand Rajpath, Claridge's combines colonial elegance with modern luxury. Afternoon tea, Mughal-inspired décor, and proximity to India Gate create an unforgettable stay." },
  { name: "Oberoi Udaivilas", location: "Lake Pichola", city: "Udaipur", country: "India", price: 29000, original: 38200, rating: 4.8, reviewCount: 1890, lat: 24.5755, lng: 73.6788, category: "luxury", featured: false, description: "On the shores of Lake Pichola, Oberoi Udaivilas offers palatial architecture, courtyards with fountains, and views of the City Palace. Romance and royalty in the heart of Rajasthan." },
  { name: "Ace Hotel Kyoto", location: "Malviya Nagar", city: "Jaipur", country: "India", price: 18500, original: 24100, rating: 4.5, reviewCount: 1102, lat: 26.9124, lng: 75.7873, category: "boutique", featured: false, description: "In Jaipur's Malviya Nagar, Ace Hotel Kyoto merges hip design with Rajasthani warmth. Rooftop dinners, local bazaars, and the Pink City's forts are just minutes away." },
  { name: "W Barcelona", location: "Baga Beach", city: "Goa", country: "India", price: 25700, original: 34000, rating: 4.6, reviewCount: 3456, lat: 15.5535, lng: 73.7527, category: "resort", featured: false, description: "On lively Baga Beach, W Barcelona brings party vibes and beachfront luxury. Pool parties, sunset bars, and water sports make it perfect for young travelers and groups." },
  { name: "The Peninsula", location: "Fort Area", city: "Mumbai", country: "India", price: 40500, original: 53000, rating: 4.8, reviewCount: 2678, lat: 18.9388, lng: 72.8354, category: "luxury", featured: false, description: "In Mumbai's historic Fort district, The Peninsula blends heritage with five-star comfort. Colonial-era charm, rooftop dining, and views of the Arabian Sea define this landmark." },
  { name: "Nobu Hotel", location: "Indiranagar", city: "Bengaluru", country: "India", price: 28200, original: 36500, rating: 4.5, reviewCount: 1543, lat: 12.9784, lng: 77.6408, category: "boutique", featured: false, description: "In Bangalore's trendy Indiranagar, Nobu Hotel offers Japanese-inspired design and its famed restaurant. Perfect for foodies and those seeking a stylish, central stay." },
  { name: "Hilton Garden Inn", location: "Anna Nagar", city: "Chennai", country: "India", price: 15000, original: 19100, rating: 4.2, reviewCount: 4567, lat: 13.0878, lng: 80.2085, category: "business", featured: false, description: "A reliable business stay in Anna Nagar. Hilton Garden Inn Chennai offers clean rooms, a 24-hour gym, and a convenient location for corporate travelers and families." },
  { name: "Conrad Maldives", location: "Lakshadweep", city: "Kavaratti", country: "India", price: 79000, original: 99600, rating: 4.9, reviewCount: 2345, lat: 10.5626, lng: 72.6369, category: "resort", featured: true, description: "In the pristine atolls of Lakshadweep, Conrad Maldives delivers overwater villas, turquoise lagoons, and world-class diving. A secluded paradise for honeymooners and adventurers." },
  { name: "Hotel Costes", location: "Lajpat Nagar", city: "New Delhi", country: "India", price: 40000, original: 51500, rating: 4.7, reviewCount: 1876, lat: 28.5675, lng: 77.2431, category: "boutique", featured: false, description: "In vibrant Lajpat Nagar, Hotel Costes offers a Parisian-inspired retreat with eclectic décor, a garden café, and easy access to Delhi's best shopping and street food." },
  { name: "The Setai", location: "Kovalam Beach", city: "Thiruvananthapuram", country: "India", price: 34900, original: 46500, rating: 4.7, reviewCount: 1923, lat: 8.4006, lng: 76.9781, category: "resort", featured: false, description: "Overlooking Kovalam's golden sands, The Setai blends Art Deco style with Keralan serenity. Cliff views, Ayurvedic spa, and beachfront dining create a calming escape." },
  { name: "Shangri-La", location: "Worli", city: "Mumbai", country: "India", price: 44000, original: 57300, rating: 4.8, reviewCount: 2190, lat: 18.9942, lng: 72.8154, category: "luxury", featured: false, description: "Along Mumbai's Worli seafront, Shangri-La offers harbour views, award-winning Chinese dining, and a serene spa. A favourite of business and leisure travelers alike." },
  { name: "Marriott Marquis", location: "Sector 18", city: "Noida", country: "India", price: 21600, original: 28200, rating: 4.4, reviewCount: 3890, lat: 28.5355, lng: 77.3910, category: "business", featured: false, description: "In Noida's bustling Sector 18, Marriott Marquis provides spacious rooms, a pool, and meeting spaces. Ideal for corporate events and Delhi-NCR business stays." },
  { name: "Westin Grand", location: "Ring Road", city: "Ahmedabad", country: "India", price: 18300, original: 24100, rating: 4.3, reviewCount: 2123, lat: 23.0225, lng: 72.5714, category: "business", featured: false, description: "On Ahmedabad's Ring Road, Westin Grand offers comfortable business travel with a fitness studio, all-day dining, and easy access to the city's commercial centres." },
  { name: "Hilton London Tower Bridge", location: "Hazratganj", city: "Lucknow", country: "India", price: 19900, original: 25700, rating: 4.5, reviewCount: 1876, lat: 26.8467, lng: 80.9462, category: "business", featured: false, description: "In Lucknow's historic Hazratganj, Hilton London Tower Bridge combines nawabi charm with modern comfort. Perfect for exploring the city's architecture, cuisine, and culture." },
  { name: "Sofitel Bangkok", location: "Brigade Road", city: "Bengaluru", country: "India", price: 16600, original: 22400, rating: 4.4, reviewCount: 2543, lat: 12.9719, lng: 77.6044, category: "business", featured: false, description: "On Bengaluru's bustling Brigade Road, Sofitel Bangkok offers French elegance with Indian warmth. Cafés, nightlife, and tech parks are all within reach." },
  { name: "Anantara Layan Phuket", location: "Anjuna Beach", city: "Goa", country: "India", price: 31500, original: 40700, rating: 4.8, reviewCount: 1234, lat: 15.5833, lng: 73.7333, category: "beach", featured: true, description: "On Goa's famous Anjuna Beach, Anantara Layan Phuket brings Thai-inspired wellness to India. Beachfront villas, yoga retreats, and flea markets nearby." },
  { name: "One&Only Reethi Rah", location: "Radhanagar Beach", city: "Havelock Island", country: "India", price: 91300, original: 116200, rating: 4.9, reviewCount: 876, lat: 11.9923, lng: 92.9615, category: "beach", featured: true, description: "On Havelock's stunning Radhanagar Beach, One&Only Reethi Rah offers villas in the jungle and by the sand. World-class diving, spa, and untouched nature define this Andaman gem." },
  { name: "Soneva Fushi", location: "Kumarakom", city: "Kottayam", country: "India", price: 73900, original: 91300, rating: 4.9, reviewCount: 654, lat: 9.5916, lng: 76.4322, category: "beach", featured: true, description: "In Kumarakom's backwater kingdom, Soneva Fushi offers overwater and garden villas. Houseboat tours, birdwatching, and sustainable luxury amidst Kerala's tranquillity." },
  { name: "Hayman Island", location: "Chowpatty", city: "Mumbai", country: "India", price: 43200, original: 56500, rating: 4.7, reviewCount: 1432, lat: 18.9667, lng: 72.8167, category: "beach", featured: false, description: "Overlooking Mumbai's iconic Chowpatty Beach, Hayman Island brings beachside luxury to the city. Sunset views, street food nearby, and a rooftop pool create a unique urban escape." },
  { name: "Sandy Lane", location: "Marina Beach Road", city: "Chennai", country: "India", price: 79000, original: 99600, rating: 4.9, reviewCount: 987, lat: 13.0569, lng: 80.2790, category: "beach", featured: true, description: "On Chennai's famous Marina Beach Road, Sandy Lane offers oceanfront luxury with infinity pools, seafood feasts, and the world's second-longest urban beach at your doorstep." },
  { name: "Four Seasons Bora Bora", location: "Palolem Beach", city: "Goa", country: "India", price: 99600, original: 124500, rating: 4.9, reviewCount: 1123, lat: 15.0104, lng: 74.0238, category: "beach", featured: true, description: "On serene Palolem Beach, Four Seasons Bora Bora delivers overwater villas, glass-floor suites, and a spa over the Arabian Sea. The ultimate Goan paradise." },
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
  if (existing.length > 0 && !FORCE) {
    console.log("Database already seeded, skipping. Use 'npm run seed -- --force' to clear and re-seed.");
    await pool.end();
    return;
  }

  if (FORCE && existing.length > 0) {
    console.log("Force re-seed: clearing hotel-related data (respecting FKs)...");
    await db.execute(sql`UPDATE transactions SET booking_id = NULL WHERE booking_id IS NOT NULL`);
    await db.delete(reviews);
    await db.delete(bookings);
    await db.delete(favorites);
    await db.delete(rooms);
    await db.delete(hotels);
    console.log("Cleared. Re-seeding...");
  }

  const demoEmail = "demo@stayease.com";
  let [demoUser] = await db.select().from(users).where(eq(users.email, demoEmail)).limit(1);
  if (!demoUser) {
    const hashedPassword = await bcrypt.hash("demo123", 10);
    [demoUser] = await db.insert(users).values({
      email: demoEmail,
      username: "demouser",
      password: hashedPassword,
      name: "Demo User",
      isVerified: true,
      role: "user",
      walletBalance: 500,
    }).returning();
    console.log(`Created demo user: ${demoUser!.email}`);
  } else {
    console.log(`Using existing demo user: ${demoUser.email}`);
  }
  if (!demoUser) throw new Error("Failed to get or create demo user");

  const supportEmail = "support@hotelbookinghub.com";
  const [existingSupport] = await db.select().from(users).where(eq(users.email, supportEmail)).limit(1);
  if (!existingSupport) {
    const supportPassword = await bcrypt.hash("support123", 10);
    const [supportUser] = await db.insert(users).values({
      email: supportEmail,
      username: "support",
      password: supportPassword,
      name: "Albert Flores",
      isVerified: true,
      role: "user",
      walletBalance: 0,
    }).returning();
    console.log(`Created support user: ${supportUser.email}`);
  }

  for (let hotelIndex = 0; hotelIndex < hotelData.length; hotelIndex++) {
    const h = hotelData[hotelIndex];
    const cat = h.category as keyof typeof AMENITIES;
    const images = getUniqueImagesForHotel(hotelIndex);
    const amenities = AMENITIES[cat] || AMENITIES.luxury;

    const [hotel] = await db.insert(hotels).values({
      name: h.name,
      location: h.location,
      city: h.city,
      country: h.country,
      description: h.description,
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

  if (FORCE) {
    await db.delete(notifications).where(eq(notifications.userId, demoUser.id));
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
