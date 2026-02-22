import { db } from "../db";
import { reviews, users, hotels } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { HotelService } from "./hotel.service";

export class ReviewService {
  static async create(userId: string, data: {
    hotelId: string;
    rating: number;
    comment: string;
    bookingId?: string;
    images?: string[];
  }) {
    const [review] = await db.insert(reviews).values({
      userId,
      hotelId: data.hotelId,
      rating: data.rating,
      comment: data.comment,
      bookingId: data.bookingId || null,
      images: Array.isArray(data.images) && data.images.length > 0 ? data.images : [],
    }).returning();

    await HotelService.updateRating(data.hotelId);

    return review;
  }

  static async getByHotel(hotelId: string, limit: number = 20, offset: number = 0) {
    return db.select({
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
      .where(eq(reviews.hotelId, hotelId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async getStats(hotelId: string) {
    const result = await db.select({
      avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
      totalReviews: sql<number>`COUNT(*)`,
      rating5: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} >= 4.5)`,
      rating4: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} >= 3.5 AND ${reviews.rating} < 4.5)`,
      rating3: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} >= 2.5 AND ${reviews.rating} < 3.5)`,
      rating2: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} >= 1.5 AND ${reviews.rating} < 2.5)`,
      rating1: sql<number>`COUNT(*) FILTER (WHERE ${reviews.rating} < 1.5)`,
    }).from(reviews).where(eq(reviews.hotelId, hotelId));

    return result[0];
  }
}
