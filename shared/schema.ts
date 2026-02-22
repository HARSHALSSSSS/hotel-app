import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  real,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull().default("Guest User"),
  phone: text("phone"),
  gender: text("gender"),
  avatar: text("avatar"),
  role: text("role").notNull().default("user"),
  walletBalance: real("wallet_balance").notNull().default(0),
  refreshToken: text("refresh_token"),
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
  otpPurpose: text("otp_purpose"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("users_email_idx").on(table.email),
]);

export const hotels = pgTable("hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  pricePerNight: real("price_per_night").notNull(),
  originalPrice: real("original_price").notNull(),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  images: jsonb("images").notNull().default([]),
  amenities: jsonb("amenities").notNull().default([]),
  latitude: real("latitude").notNull().default(0),
  longitude: real("longitude").notNull().default(0),
  category: text("category").notNull().default("luxury"),
  featured: boolean("featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("hotels_city_idx").on(table.city),
  index("hotels_category_idx").on(table.category),
  index("hotels_rating_idx").on(table.rating),
  index("hotels_price_idx").on(table.pricePerNight),
]);

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pricePerNight: real("price_per_night").notNull(),
  maxGuests: integer("max_guests").notNull().default(2),
  bedType: text("bed_type").notNull(),
  size: integer("size").notNull(),
  amenities: jsonb("amenities").notNull().default([]),
  image: text("image"),
  available: boolean("available").notNull().default(true),
  totalRooms: integer("total_rooms").notNull().default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("rooms_hotel_id_idx").on(table.hotelId),
]);

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  guests: integer("guests").notNull().default(1),
  nights: integer("nights").notNull().default(1),
  subtotal: real("subtotal").notNull(),
  taxes: real("taxes").notNull(),
  serviceFee: real("service_fee").notNull().default(25),
  totalPrice: real("total_price").notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("bookings_user_id_idx").on(table.userId),
  index("bookings_hotel_id_idx").on(table.hotelId),
  index("bookings_status_idx").on(table.status),
]);

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  rating: real("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("reviews_hotel_id_idx").on(table.hotelId),
  index("reviews_user_id_idx").on(table.userId),
]);

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("favorites_user_hotel_idx").on(table.userId, table.hotelId),
]);

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("system"),
  read: boolean("read").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
]);

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  amount: real("amount").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  paymentGateway: text("payment_gateway"),
  gatewayOrderId: text("gateway_order_id"),
  gatewayPaymentId: text("gateway_payment_id"),
  gatewaySignature: text("gateway_signature"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("transactions_user_id_idx").on(table.userId),
  index("transactions_booking_id_idx").on(table.bookingId),
]);

export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  user2Id: varchar("user2_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("chat_conversations_user1_idx").on(table.user1Id),
  index("chat_conversations_user2_idx").on(table.user2Id),
  uniqueIndex("chat_conversations_users_idx").on(table.user1Id, table.user2Id),
]);

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("chat_messages_conversation_idx").on(table.conversationId),
  index("chat_messages_sender_idx").on(table.senderId),
]);

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  name: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const createBookingSchema = z.object({
  hotelId: z.string(),
  roomId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().min(1).max(10),
  nights: z.number().min(1),
  paymentMethod: z.enum(["wallet", "on_arrival"]).optional().default("on_arrival"),
});

export const createReviewSchema = z.object({
  hotelId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(5),
  bookingId: z.string().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Hotel = typeof hotels.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;