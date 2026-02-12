import { db } from "../db";
import { bookings, rooms, hotels, notifications } from "@shared/schema";
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
    }).returning();

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
      roomName: rooms.name,
    })
      .from(bookings)
      .innerJoin(hotels, eq(bookings.hotelId, hotels.id))
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(eq(bookings.userId, userId))
      .orderBy(sql`${bookings.createdAt} DESC`);

    return result.map((b) => ({
      ...b,
      hotelImage: (b.hotelImage as string[])?.[0],
    }));
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
      roomName: rooms.name,
    })
      .from(bookings)
      .innerJoin(hotels, eq(bookings.hotelId, hotels.id))
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) throw new Error("Booking not found");

    return {
      ...booking,
      hotelImage: (booking.hotelImage as string[])?.[0],
    };
  }

  static async cancel(bookingId: string, userId: string) {
    const [booking] = await db.select().from(bookings).where(
      and(eq(bookings.id, bookingId), eq(bookings.userId, userId))
    ).limit(1);

    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled") throw new Error("Booking already cancelled");

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
