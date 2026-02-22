import { db } from "../db";
import { hotels, rooms, reviews, users } from "@shared/schema";
import { eq, and, gte, lte, like, sql, desc, asc, ilike, or } from "drizzle-orm";

export class HotelService {
  static async getAll(params: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    search?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
    featured?: boolean;
  } = {}) {
    const conditions: any[] = [eq(hotels.isActive, true)];

    if (params.category && params.category !== "all") {
      conditions.push(eq(hotels.category, params.category));
    }
    if (params.minPrice !== undefined) {
      conditions.push(gte(hotels.pricePerNight, params.minPrice));
    }
    if (params.maxPrice !== undefined) {
      conditions.push(lte(hotels.pricePerNight, params.maxPrice));
    }
    if (params.minRating !== undefined) {
      conditions.push(gte(hotels.rating, params.minRating));
    }
    if (params.featured !== undefined) {
      conditions.push(eq(hotels.featured, params.featured));
    }
    if (params.search) {
      conditions.push(
        or(
          ilike(hotels.name, `%${params.search}%`),
          ilike(hotels.city, `%${params.search}%`),
          ilike(hotels.country, `%${params.search}%`),
          ilike(hotels.location, `%${params.search}%`)
        )
      );
    }

    let orderBy: any;
    switch (params.sortBy) {
      case "price_low": orderBy = asc(hotels.pricePerNight); break;
      case "price_high": orderBy = desc(hotels.pricePerNight); break;
      case "rating": orderBy = desc(hotels.rating); break;
      default: orderBy = desc(hotels.reviewCount);
    }

    const result = await db.select()
      .from(hotels)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(params.limit || 50)
      .offset(params.offset || 0);

    return result;
  }

  static async getById(id: string) {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
    if (!hotel) throw new Error("Hotel not found");

    const hotelRooms = await db.select().from(rooms).where(eq(rooms.hotelId, id));

    const hotelReviews = await db.select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      images: reviews.images,
      createdAt: reviews.createdAt,
      userId: reviews.userId,
      userName: users.name,
      userAvatar: users.avatar,
    })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.hotelId, id))
      .orderBy(desc(reviews.createdAt))
      .limit(20);

    return {
      ...hotel,
      rooms: hotelRooms,
      reviews: hotelReviews,
    };
  }

  static async create(data: any) {
    const [hotel] = await db.insert(hotels).values(data).returning();
    return hotel;
  }

  static async update(id: string, data: any) {
    const [hotel] = await db.update(hotels).set({ ...data, updatedAt: new Date() }).where(eq(hotels.id, id)).returning();
    return hotel;
  }

  static async delete(id: string) {
    await db.update(hotels).set({ isActive: false, updatedAt: new Date() }).where(eq(hotels.id, id));
    return { success: true };
  }

  static async getNearby(lat: number, lng: number, radiusKm: number = 50) {
    const allHotels = await db.select().from(hotels).where(eq(hotels.isActive, true));

    return allHotels
      .map((hotel) => ({
        ...hotel,
        distance: this.haversineDistance(lat, lng, hotel.latitude, hotel.longitude),
      }))
      .filter((h) => h.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  static async getRooms(hotelId: string) {
    return db.select().from(rooms).where(eq(rooms.hotelId, hotelId));
  }

  static async getRoomById(roomId: string) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    return room;
  }

  static async updateRating(hotelId: string) {
    const result = await db.select({
      avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
      count: sql<number>`COUNT(*)`,
    }).from(reviews).where(eq(reviews.hotelId, hotelId));

    if (result[0]) {
      await db.update(hotels).set({
        rating: Math.round(result[0].avgRating * 10) / 10,
        reviewCount: Number(result[0].count),
        updatedAt: new Date(),
      }).where(eq(hotels.id, hotelId));
    }
  }

  private static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private static toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
