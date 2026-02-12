import { db } from "../db";
import { favorites, hotels } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class FavoriteService {
  static async getByUser(userId: string) {
    const result = await db.select({
      hotelId: favorites.hotelId,
    })
      .from(favorites)
      .where(eq(favorites.userId, userId));

    return result.map((f) => f.hotelId);
  }

  static async toggle(userId: string, hotelId: string) {
    const existing = await db.select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.hotelId, hotelId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.hotelId, hotelId)));
      return { favorited: false };
    }

    await db.insert(favorites).values({ userId, hotelId });
    return { favorited: true };
  }

  static async getSavedHotels(userId: string) {
    return db.select({
      id: hotels.id,
      name: hotels.name,
      location: hotels.location,
      city: hotels.city,
      country: hotels.country,
      pricePerNight: hotels.pricePerNight,
      originalPrice: hotels.originalPrice,
      rating: hotels.rating,
      reviewCount: hotels.reviewCount,
      images: hotels.images,
      amenities: hotels.amenities,
      category: hotels.category,
      featured: hotels.featured,
    })
      .from(favorites)
      .innerJoin(hotels, eq(favorites.hotelId, hotels.id))
      .where(eq(favorites.userId, userId));
  }
}
