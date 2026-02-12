import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { AuthService } from "./services/auth.service";
import { HotelService } from "./services/hotel.service";
import { BookingService, bookingEvents } from "./services/booking.service";
import { ReviewService } from "./services/review.service";
import { NotificationService } from "./services/notification.service";
import { FavoriteService } from "./services/favorite.service";
import { authMiddleware, optionalAuth } from "./middleware/auth";
import { registerSchema, loginSchema, createBookingSchema, createReviewSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

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
      const result = await BookingService.cancel(req.params.id, req.user!.userId);
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

    ws.on("close", () => {
      if (userId) {
        wsClients.get(userId)?.delete(ws);
        if (wsClients.get(userId)?.size === 0) {
          wsClients.delete(userId);
        }
      }
    });
  });

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

  bookingEvents.on("booking:created", (data) => {
    sendToUser(data.userId, { type: "booking:created", data });
  });

  bookingEvents.on("booking:cancelled", (data) => {
    sendToUser(data.userId, { type: "booking:cancelled", data });
  });

  bookingEvents.on("booking:status_changed", (data) => {
    sendToUser(data.userId, { type: "booking:status_changed", data });
  });

  return httpServer;
}
