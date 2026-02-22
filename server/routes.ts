import express, { type Express } from "express";
import { createServer, type Server } from "node:http";
import { createHmac } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import multer from "multer";
import Razorpay from "razorpay";
import { AuthService } from "./services/auth.service";
import { HotelService } from "./services/hotel.service";
import { BookingService, bookingEvents } from "./services/booking.service";
import { ReviewService } from "./services/review.service";
import { NotificationService } from "./services/notification.service";
import { FavoriteService } from "./services/favorite.service";
import { ChatService } from "./services/chat.service";
import { authMiddleware, optionalAuth } from "./middleware/auth";
import { registerSchema, loginSchema, createBookingSchema, createReviewSchema } from "@shared/schema";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const razorpayInstance = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET }) : null;

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `chat-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || ".m4a"}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.use("/uploads", express.static(UPLOADS_DIR));

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data.email, data.password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });
      const result = await AuthService.refreshTokens(refreshToken);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  });

  app.post("/api/auth/otp/request", async (req, res) => {
    try {
      const { email } = req.body;
      const result = await AuthService.requestOtp(email);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/otp/verify", async (req, res) => {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.verifyOtp(email, otp);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") return res.status(400).json({ message: "Email required" });
      const result = await AuthService.forgotPassword(email.trim());
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/verify-reset-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });
      const result = await AuthService.verifyResetOtp(email.trim(), String(otp).trim());
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) return res.status(400).json({ message: "Reset token and new password required" });
      if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
      await AuthService.resetPassword(resetToken, newPassword);
      res.json({ message: "Password updated" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/profile", authMiddleware, async (req, res) => {
    try {
      const user = await AuthService.getProfile(req.user!.userId);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/auth/profile", authMiddleware, async (req, res) => {
    try {
      const user = await AuthService.updateProfile(req.user!.userId, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/change-password", authMiddleware, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword || typeof currentPassword !== "string" || typeof newPassword !== "string") {
        return res.status(400).json({ message: "Current password and new password required" });
      }
      await AuthService.changePassword(req.user!.userId, currentPassword, newPassword);
      res.json({ message: "Password updated" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/delete-account", authMiddleware, async (req, res) => {
    try {
      const { password } = req.body;
      if (!password || typeof password !== "string") return res.status(400).json({ message: "Password required" });
      await AuthService.deleteAccount(req.user!.userId, password);
      res.json({ message: "Account deleted" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/wallet/top-up", authMiddleware, async (req, res) => {
    try {
      const amount = Number(req.body?.amount);
      if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
      const result = await AuthService.topUpWallet(req.user!.userId, amount);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/hotels", async (req, res) => {
    try {
      const { category, minPrice, maxPrice, minRating, search, sortBy, limit, offset, featured } = req.query;
      const result = await HotelService.getAll({
        category: category as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        search: search as string,
        sortBy: sortBy as string,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        featured: featured === "true" ? true : featured === "false" ? false : undefined,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/hotels/nearby", async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      if (!lat || !lng) return res.status(400).json({ message: "lat and lng required" });
      const result = await HotelService.getNearby(
        Number(lat), Number(lng), radius ? Number(radius) : 50
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/hotels/:id", async (req, res) => {
    try {
      const hotel = await HotelService.getById(req.params.id);
      res.json(hotel);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  app.get("/api/hotels/:id/rooms", async (req, res) => {
    try {
      const rooms = await HotelService.getRooms(req.params.id);
      res.json(rooms);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/hotels/:id/reviews", async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const reviews = await ReviewService.getByHotel(
        req.params.id,
        limit ? Number(limit) : 20,
        offset ? Number(offset) : 0
      );
      res.json(reviews);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/hotels/:id/reviews/stats", async (req, res) => {
    try {
      const stats = await ReviewService.getStats(req.params.id);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/bookings", authMiddleware, async (req, res) => {
    try {
      const data = createBookingSchema.parse(req.body);
      const booking = await BookingService.create(req.user!.userId, data);
      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/payments/create-order", authMiddleware, async (req, res) => {
    try {
      if (!razorpayInstance) {
        return res.status(503).json({ message: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." });
      }
      const { amountINR, bookingData } = req.body;
      if (typeof amountINR !== "number" || amountINR <= 0 || !bookingData || typeof bookingData.hotelId !== "string" || typeof bookingData.roomId !== "string") {
        return res.status(400).json({ message: "Invalid request. Send amountINR (number) and bookingData (hotelId, roomId, checkIn, checkOut, guests, nights)." });
      }
      const amountPaise = Math.round(amountINR * 100);
      if (amountPaise < 100) {
        return res.status(400).json({ message: "Amount too small (min ~$0.01 INR equivalent)." });
      }
      const order = await razorpayInstance.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `booking_${Date.now()}`,
      });
      res.json({
        orderId: order.id,
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create order." });
    }
  });

  app.post("/api/payments/verify", authMiddleware, async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingData) {
        return res.status(400).json({ message: "Missing payment or booking data." });
      }
      const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Payment verification failed." });
      }
      const data = {
        hotelId: bookingData.hotelId,
        roomId: bookingData.roomId,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: Number(bookingData.guests) || 1,
        nights: Number(bookingData.nights) || 1,
      };
      const booking = await BookingService.createFromRazorpay(req.user!.userId, data, razorpay_order_id, razorpay_payment_id);
      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Verification failed." });
    }
  });

  app.get("/api/bookings", authMiddleware, async (req, res) => {
    try {
      const bookings = await BookingService.getByUser(req.user!.userId);
      res.json(bookings);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/bookings/:id", authMiddleware, async (req, res) => {
    try {
      const booking = await BookingService.getById(req.params.id);
      res.json(booking);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  });

  app.post("/api/bookings/:id/cancel", authMiddleware, async (req, res) => {
    try {
      const reason = (req.body && typeof req.body.reason === "string") ? req.body.reason : undefined;
      const result = await BookingService.cancel(req.params.id, req.user!.userId, reason);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/reviews", authMiddleware, async (req, res) => {
    try {
      const data = createReviewSchema.parse(req.body);
      const review = await ReviewService.create(req.user!.userId, data);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/favorites", authMiddleware, async (req, res) => {
    try {
      const hotelIds = await FavoriteService.getByUser(req.user!.userId);
      res.json(hotelIds);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/favorites/:hotelId", authMiddleware, async (req, res) => {
    try {
      const result = await FavoriteService.toggle(req.user!.userId, req.params.hotelId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/favorites/hotels", authMiddleware, async (req, res) => {
    try {
      const hotels = await FavoriteService.getSavedHotels(req.user!.userId);
      res.json(hotels);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/notifications", authMiddleware, async (req, res) => {
    try {
      const notifs = await NotificationService.getByUser(req.user!.userId);
      res.json(notifs);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.userId);
      res.json({ count });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/notifications/:id/read", authMiddleware, async (req, res) => {
    try {
      const notif = await NotificationService.markRead(req.params.id, req.user!.userId);
      res.json(notif);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/notifications/read-all", authMiddleware, async (req, res) => {
    try {
      const result = await NotificationService.markAllRead(req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const wsClients = new Map<string, Set<WebSocket>>();
  const callRooms = new Map<string, Map<string, WebSocket>>();
  const MAX_PEERS_PER_ROOM = 2;

  async function getSupportUserId(): Promise<string | null> {
    const supportEmail = process.env.CHAT_SUPPORT_EMAIL || "support@hotelbookinghub.com";
    const { db } = await import("./db");
    const { users } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, supportEmail)).limit(1);
    return u?.id ?? null;
  }

  function sendToUser(userId: string, data: any) {
    const clients = wsClients.get(userId);
    if (clients) {
      const message = JSON.stringify(data);
      clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token");
    let userId: string | null = null;

    if (token) {
      try {
        const payload = AuthService.verifyAccessToken(token);
        userId = payload.userId;
        if (!wsClients.has(userId)) {
          wsClients.set(userId, new Set());
        }
        wsClients.get(userId)!.add(ws);
        ws.send(JSON.stringify({ type: "connected", userId }));
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
      }
    }

    ws.on("message", async (raw) => {
      if (!userId) return;
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "call:start" && typeof msg.callId === "string") {
          const supportId = await getSupportUserId();
          if (supportId) {
            sendToUser(supportId, {
              type: "call:incoming",
              callId: msg.callId,
              hotelId: msg.hotelId || "",
              hotelName: msg.hotelName || "Hotel",
              fromUserId: userId,
              fromName: msg.fromName || "Guest",
            });
          }
        } else if (msg.type === "call:join" && typeof msg.roomId === "string") {
          const roomId = msg.roomId;
          if (!callRooms.has(roomId)) callRooms.set(roomId, new Map());
          const room = callRooms.get(roomId)!;
          if (room.size >= MAX_PEERS_PER_ROOM) {
            ws.send(JSON.stringify({ type: "call:room-full", roomId }));
            return;
          }
          room.set(userId, ws);
          const peerIds = Array.from(room.keys()).filter((id) => id !== userId);
          ws.send(JSON.stringify({ type: "call:peers", roomId, peerIds }));
          peerIds.forEach((peerId) => {
            const peerWs = room.get(peerId);
            if (peerWs && peerWs.readyState === WebSocket.OPEN) {
              peerWs.send(JSON.stringify({ type: "call:peer-joined", roomId, userId }));
            }
          });
        } else if (msg.type === "call:leave" && typeof msg.roomId === "string") {
          const room = callRooms.get(msg.roomId);
          if (room) {
            room.delete(userId);
            if (room.size === 0) callRooms.delete(msg.roomId);
            else {
              room.forEach((peerWs) => {
                if (peerWs.readyState === WebSocket.OPEN) {
                  peerWs.send(JSON.stringify({ type: "call:peer-left", roomId: msg.roomId, userId }));
                }
              });
            }
          }
        } else if (
          (msg.type === "call:offer" || msg.type === "call:answer" || msg.type === "call:ice") &&
          typeof msg.toUserId === "string"
        ) {
          const targetClients = wsClients.get(msg.toUserId);
          if (targetClients) {
            const payload = { ...msg, fromUserId: userId };
            const str = JSON.stringify(payload);
            targetClients.forEach((w) => {
              if (w.readyState === WebSocket.OPEN) w.send(str);
            });
          }
        }
      } catch {
        // ignore invalid JSON
      }
    });

    ws.on("close", () => {
      if (userId) {
        callRooms.forEach((room, roomId) => {
          if (room.has(userId)) {
            room.delete(userId);
            if (room.size === 0) callRooms.delete(roomId);
            else {
              room.forEach((peerWs) => {
                if (peerWs.readyState === WebSocket.OPEN) {
                  peerWs.send(JSON.stringify({ type: "call:peer-left", roomId, userId }));
                }
              });
            }
          }
        });
        wsClients.get(userId)?.delete(ws);
        if (wsClients.get(userId)?.size === 0) {
          wsClients.delete(userId);
        }
      }
    });
  });

  bookingEvents.on("booking:created", (data) => {
    sendToUser(data.userId, { type: "booking:created", data });
  });

  bookingEvents.on("booking:cancelled", (data) => {
    sendToUser(data.userId, { type: "booking:cancelled", data });
  });

  bookingEvents.on("booking:status_changed", (data) => {
    sendToUser(data.userId, { type: "booking:status_changed", data });
  });

  app.get("/api/chat/conversations", authMiddleware, async (req, res) => {
    try {
      const list = await ChatService.getConversationsForUser(req.user!.userId);
      res.json(list);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/chat/conversations", authMiddleware, async (req, res) => {
    try {
      const { otherUserId } = req.body;
      if (!otherUserId) return res.status(400).json({ message: "otherUserId required" });
      const convo = await ChatService.getOrCreateConversation(req.user!.userId, otherUserId);
      res.json(convo);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/chat/conversations/:id/messages", authMiddleware, async (req, res) => {
    try {
      const messages = await ChatService.getMessages(req.params.id, req.user!.userId);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/upload", authMiddleware, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const url = `${baseUrl}/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/chat/messages", authMiddleware, async (req, res) => {
    try {
      const { conversationId, content, type } = req.body;
      if (!conversationId || !content) return res.status(400).json({ message: "conversationId and content required" });
      const msg = await ChatService.createMessage(
        conversationId,
        req.user!.userId,
        String(content),
        type === "image" || type === "audio" ? type : "text"
      );
      const payload = {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        content: msg.content,
        type: msg.type,
        createdAt: msg.createdAt,
      };
      sendToUser(msg.recipientId, { type: "chat:message", data: payload });
      res.status(201).json(payload);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/chat/support-user", authMiddleware, async (req, res) => {
    try {
      const supportEmail = process.env.CHAT_SUPPORT_EMAIL || "support@hotelbookinghub.com";
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      let [u] = await db.select().from(users).where(eq(users.email, supportEmail)).limit(1);
      if (!u) {
        try {
          const hashedPassword = await bcrypt.hash("support123", 10);
          [u] = await db.insert(users).values({
            email: supportEmail,
            username: "support",
            password: hashedPassword,
            name: "Hotel Support",
            isVerified: true,
            role: "user",
            walletBalance: 0,
          }).returning();
        } catch (createErr: any) {
          if (createErr?.code === "23505") {
            [u] = await db.select().from(users).where(eq(users.email, supportEmail)).limit(1);
          } else {
            throw createErr;
          }
        }
      }
      if (!u) return res.status(404).json({ message: "Support user not found" });
      res.json({ id: u.id, name: u.name, avatar: u.avatar });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return httpServer;
}
