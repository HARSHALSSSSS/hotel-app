import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "stayease-jwt-secret-2025";
const JWT_REFRESH_SECRET = JWT_SECRET + "-refresh";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  static async register(data: { email: string; username: string; password: string; name: string }) {
    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing.length > 0) {
      throw new Error("Email already registered");
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, data.username)).limit(1);
    if (existingUsername.length > 0) {
      throw new Error("Username already taken");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const [user] = await db.insert(users).values({
      email: data.email,
      username: data.username,
      password: hashedPassword,
      name: data.name,
      isVerified: true,
    }).returning();

    const tokens = this.generateTokens(user);
    await db.update(users).set({ refreshToken: tokens.refreshToken }).where(eq(users.id, user.id));

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async login(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const tokens = this.generateTokens(user);
    await db.update(users).set({ refreshToken: tokens.refreshToken, updatedAt: new Date() }).where(eq(users.id, user.id));

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async refreshTokens(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;
      const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

      if (!user || user.refreshToken !== refreshToken) {
        throw new Error("Invalid refresh token");
      }

      const tokens = this.generateTokens(user);
      await db.update(users).set({ refreshToken: tokens.refreshToken, updatedAt: new Date() }).where(eq(users.id, user.id));

      return tokens;
    } catch {
      throw new Error("Invalid refresh token");
    }
  }

  static async requestOtp(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new Error("User not found");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await db.update(users).set({ otpCode: otp, otpExpiry: expiry }).where(eq(users.id, user.id));

    console.log(`[OTP] Code for ${email}: ${otp}`);

    return { message: "OTP sent successfully", otp: process.env.NODE_ENV === "development" ? otp : undefined };
  }

  static async verifyOtp(email: string, otp: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw new Error("User not found");
    if (!user.otpCode || !user.otpExpiry) throw new Error("No OTP requested");
    if (new Date() > user.otpExpiry) throw new Error("OTP expired");
    if (user.otpCode !== otp) throw new Error("Invalid OTP");

    await db.update(users).set({ otpCode: null, otpExpiry: null, isVerified: true }).where(eq(users.id, user.id));

    const tokens = this.generateTokens(user);
    await db.update(users).set({ refreshToken: tokens.refreshToken }).where(eq(users.id, user.id));

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  static async getProfile(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error("User not found");
    return this.sanitizeUser(user);
  }

  static async updateProfile(userId: string, data: Partial<{ name: string; phone: string; avatar: string }>) {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    return this.sanitizeUser(user);
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  private static generateTokens(user: typeof users.$inferSelect) {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

    return { accessToken, refreshToken };
  }

  private static sanitizeUser(user: typeof users.$inferSelect) {
    const { password, refreshToken, otpCode, otpExpiry, ...safe } = user;
    return safe;
  }
}
