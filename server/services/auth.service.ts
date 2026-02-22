import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users, transactions, bookings, reviews } from "@shared/schema";
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

    const hashedPassword = await bcrypt.hash(data.password, 10);

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

  static async updateProfile(userId: string, data: Partial<{ name: string; phone: string; avatar: string; gender: string }>) {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    if (!user) throw new Error("User not found");
    return this.sanitizeUser(user);
  }

  static async topUpWallet(userId: string, amount: number) {
    if (amount <= 0 || !Number.isFinite(amount)) throw new Error("Invalid amount");
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error("User not found");
    const current = Number(user.walletBalance ?? 0);
    const newBalance = current + amount;
    await db.update(users).set({ walletBalance: newBalance, updatedAt: new Date() }).where(eq(users.id, userId));
    await db.insert(transactions).values({
      userId,
      amount: amount,
      type: "topup",
      status: "completed",
      paymentGateway: "wallet",
    });
    return { balance: newBalance };
  }

  static async forgotPassword(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw new Error("User not found");
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await db.update(users).set({ otpCode: otp, otpExpiry: expiry, otpPurpose: "reset" }).where(eq(users.id, user.id));
    console.log(`[Reset OTP] Code for ${email}: ${otp}`);
    return { message: "OTP sent to your email", otp: process.env.NODE_ENV === "development" ? otp : undefined };
  }

  static async verifyResetOtp(email: string, otp: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw new Error("User not found");
    if (user.otpPurpose !== "reset" || !user.otpCode || !user.otpExpiry) throw new Error("No reset OTP requested");
    if (new Date() > user.otpExpiry) throw new Error("OTP expired");
    if (user.otpCode !== otp) throw new Error("Invalid OTP");
    await db.update(users).set({ otpCode: null, otpExpiry: null, otpPurpose: null }).where(eq(users.id, user.id));
    const resetToken = jwt.sign(
      { email: user.email, purpose: "password_reset" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );
    return { resetToken };
  }

  static async resetPassword(resetToken: string, newPassword: string) {
    try {
      const payload = jwt.verify(resetToken, JWT_SECRET) as { email: string; purpose: string };
      if (payload.purpose !== "password_reset") throw new Error("Invalid token");
      const [user] = await db.select().from(users).where(eq(users.email, payload.email)).limit(1);
      if (!user) throw new Error("User not found");
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, user.id));
      return { message: "Password updated" };
    } catch (e: any) {
      if (e.name === "TokenExpiredError") throw new Error("Reset link expired");
      throw e;
    }
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error("User not found");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error("Current password is incorrect");
    if (newPassword.length < 6) throw new Error("New password must be at least 6 characters");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, userId));
    return { message: "Password updated" };
  }

  static async deleteAccount(userId: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error("User not found");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid password");
    await db.delete(transactions).where(eq(transactions.userId, userId));
    await db.delete(bookings).where(eq(bookings.userId, userId));
    await db.delete(reviews).where(eq(reviews.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    return { message: "Account deleted" };
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
    const { password, refreshToken, otpCode, otpExpiry, otpPurpose, ...safe } = user;
    return safe;
  }
}
