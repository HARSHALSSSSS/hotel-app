import { db } from "../db";
import { bookings, rooms, hotels, notifications, users, transactions } from "@shared/schema";
import { eq, and, gte, lte, or, sql } from "drizzle-orm";
import { EventEmitter } from "events";

export const bookingEvents = new EventEmitter();

export class BookingService {
  static async create(userId: string, data: {
    hotelId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    paymentMethod?: "wallet" | "on_arrival";
  }) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, data.roomId)).limit(1);
    if (!room) throw new Error("Room not found");
    if (!room.available) throw new Error("Room not available");

    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);

    const conflicts = await db.select().from(bookings).where(
      and(
        eq(bookings.roomId, data.roomId),
        eq(bookings.status, "confirmed"),
        or(
          and(lte(bookings.checkIn, checkOutDate), gte(bookings.checkOut, checkInDate))
        )
      )
    );

    if (conflicts.length >= room.totalRooms) {
      throw new Error("No rooms available for the selected dates");
    }

    const subtotal = room.pricePerNight * data.nights;
    const taxes = Math.round(subtotal * 0.12);
    const serviceFee = 25;
    const totalPrice = subtotal + taxes + serviceFee;

    const paymentMethod = data.paymentMethod ?? "on_arrival";
    let paymentStatus: "pending" | "completed" = "completed";

    if (paymentMethod === "wallet") {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) throw new Error("User not found");
      const balance = Number(user.walletBalance ?? 0);
      if (balance < totalPrice) {
        throw new Error(`Insufficient wallet balance. You have ₹${balance.toLocaleString("en-IN")}, need ₹${totalPrice.toLocaleString("en-IN")}.`);
      }
      await db.update(users)
        .set({ walletBalance: balance - totalPrice, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } else {
      paymentStatus = "pending";
    }

    const [booking] = await db.insert(bookings).values({
      userId,
      hotelId: data.hotelId,
      roomId: data.roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: data.guests,
      nights: data.nights,
      subtotal,
      taxes,
      serviceFee,
      totalPrice,
      status: "confirmed",
      paymentStatus,
    }).returning();

    if (paymentMethod === "wallet") {
      await db.insert(transactions).values({
        userId,
        bookingId: booking.id,
        amount: -totalPrice,
        type: "booking",
        status: "completed",
        paymentGateway: "wallet",
      });
    }

    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, data.hotelId)).limit(1);

    await db.insert(notifications).values({
      userId,
      title: "Booking Confirmed",
      message: `Your reservation at ${hotel?.name || "the hotel"} has been confirmed for ${checkInDate.toLocaleDateString()} - ${checkOutDate.toLocaleDateString()}.`,
      type: "booking",
    });

    bookingEvents.emit("booking:created", {
      bookingId: booking.id,
      userId,
      hotelId: data.hotelId,
      status: "confirmed",
    });

    return {
      ...booking,
      hotelName: hotel?.name,
      hotelImage: (hotel?.images as string[])?.[0],
      roomName: room.name,
    };
  }

  static async createFromRazorpay(
    userId: string,
    data: { hotelId: string; roomId: string; checkIn: string; checkOut: string; guests: number; nights: number },
    razorpayOrderId: string,
    razorpayPaymentId: string
  ) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, data.roomId)).limit(1);
    if (!room) throw new Error("Room not found");
    if (!room.available) throw new Error("Room not available");

    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);

    const conflicts = await db.select().from(bookings).where(
      and(
        eq(bookings.roomId, data.roomId),
        eq(bookings.status, "confirmed"),
        or(and(lte(bookings.checkIn, checkOutDate), gte(bookings.checkOut, checkInDate)))
      )
    );

    if (conflicts.length >= room.totalRooms) {
      throw new Error("No rooms available for the selected dates");
    }

    const subtotal = room.pricePerNight * data.nights;
    const taxes = Math.round(subtotal * 0.12);
    const serviceFee = 25;
    const totalPrice = subtotal + taxes + serviceFee;

    const [booking] = await db.insert(bookings).values({
      userId,
      hotelId: data.hotelId,
      roomId: data.roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: data.guests,
      nights: data.nights,
      subtotal,
      taxes,
      serviceFee,
      totalPrice,
      status: "confirmed",
      paymentStatus: "completed",
      paymentId: razorpayPaymentId,
    }).returning();

    await db.insert(transactions).values({
      userId,
      bookingId: booking.id,
      amount: -totalPrice,
      type: "booking",
      status: "completed",
      paymentGateway: "razorpay",
      gatewayOrderId: razorpayOrderId,
      gatewayPaymentId: razorpayPaymentId,
    });

    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, data.hotelId)).limit(1);

    await db.insert(notifications).values({
      userId,
      title: "Booking Confirmed",
      message: `Your reservation at ${hotel?.name || "the hotel"} has been confirmed for ${checkInDate.toLocaleDateString()} - ${checkOutDate.toLocaleDateString()}. Payment received via Razorpay.`,
      type: "booking",
    });

    bookingEvents.emit("booking:created", {
      bookingId: booking.id,
      userId,
      hotelId: data.hotelId,
      status: "confirmed",
    });

    return {
      ...booking,
      hotelName: hotel?.name,
      hotelImage: (hotel?.images as string[])?.[0],
      roomName: room.name,
    };
  }

  static async getByUser(userId: string) {
    const result = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      hotelId: bookings.hotelId,
      roomId: bookings.roomId,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      guests: bookings.guests,
      nights: bookings.nights,
      subtotal: bookings.subtotal,
      taxes: bookings.taxes,
      serviceFee: bookings.serviceFee,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      createdAt: bookings.createdAt,
      hotelName: hotels.name,
      hotelImage: hotels.images,
      hotelCity: hotels.city,
      hotelCountry: hotels.country,
      hotelRating: hotels.rating,
      roomName: rooms.name,
    })
      .from(bookings)
      .innerJoin(hotels, eq(bookings.hotelId, hotels.id))
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(eq(bookings.userId, userId))
      .orderBy(sql`${bookings.createdAt} DESC`);

    return result.map((b) => {
      let imgs = b.hotelImage;
      if (typeof imgs === "string") { try { imgs = JSON.parse(imgs); } catch { imgs = []; } }
      if (!Array.isArray(imgs)) imgs = [];
      return {
        ...b,
        hotelImage: imgs[0] || null,
        location: [b.hotelCity, b.hotelCountry].filter(Boolean).join(", ") || "—",
        rating: Number(b.hotelRating) || 0,
      };
    });
  }

  static async getById(bookingId: string) {
    const [booking] = await db.select({
      id: bookings.id,
      userId: bookings.userId,
      hotelId: bookings.hotelId,
      roomId: bookings.roomId,
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
      guests: bookings.guests,
      nights: bookings.nights,
      subtotal: bookings.subtotal,
      taxes: bookings.taxes,
      serviceFee: bookings.serviceFee,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      createdAt: bookings.createdAt,
      hotelName: hotels.name,
      hotelImage: hotels.images,
      hotelCity: hotels.city,
      hotelCountry: hotels.country,
      hotelRating: hotels.rating,
      roomName: rooms.name,
    })
      .from(bookings)
      .innerJoin(hotels, eq(bookings.hotelId, hotels.id))
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) throw new Error("Booking not found");

    let bImgs = booking.hotelImage;
    if (typeof bImgs === "string") { try { bImgs = JSON.parse(bImgs); } catch { bImgs = []; } }
    if (!Array.isArray(bImgs)) bImgs = [];
    return {
      ...booking,
      hotelImage: bImgs[0] || null,
      location: [booking.hotelCity, booking.hotelCountry].filter(Boolean).join(", ") || "—",
      rating: Number(booking.hotelRating) || 0,
    };
  }

  static async cancel(bookingId: string, userId: string, _reason?: string) {
    const [booking] = await db.select().from(bookings).where(
      and(eq(bookings.id, bookingId), eq(bookings.userId, userId))
    ).limit(1);

    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled") throw new Error("Booking already cancelled");

    if (booking.paymentStatus === "completed" && !booking.paymentId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user) {
        const balance = Number(user.walletBalance ?? 0);
        await db.update(users)
          .set({ walletBalance: balance + booking.totalPrice, updatedAt: new Date() })
          .where(eq(users.id, userId));
        await db.insert(transactions).values({
          userId,
          bookingId: booking.id,
          amount: booking.totalPrice,
          type: "refund",
          status: "completed",
          paymentGateway: "wallet",
        });
      }
    }

    const [updated] = await db.update(bookings).set({
      status: "cancelled",
      paymentStatus: "refunded",
      updatedAt: new Date(),
    }).where(eq(bookings.id, bookingId)).returning();

    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, booking.hotelId)).limit(1);

    await db.insert(notifications).values({
      userId,
      title: "Booking Cancelled",
      message: `Your reservation at ${hotel?.name || "the hotel"} has been cancelled. A refund will be processed.`,
      type: "booking",
    });

    bookingEvents.emit("booking:cancelled", {
      bookingId,
      userId,
      hotelId: booking.hotelId,
    });

    return updated;
  }

  static async updateStatus(bookingId: string, status: string) {
    const [updated] = await db.update(bookings).set({
      status,
      updatedAt: new Date(),
    }).where(eq(bookings.id, bookingId)).returning();

    bookingEvents.emit("booking:status_changed", {
      bookingId,
      userId: updated.userId,
      status,
    });

    return updated;
  }
}
