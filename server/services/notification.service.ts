import { db } from "../db";
import { notifications } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export class NotificationService {
  static async getByUser(userId: string, limit: number = 50) {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  static async markRead(notificationId: string, userId: string) {
    const [updated] = await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning();
    return updated;
  }

  static async markAllRead(userId: string) {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
    return { success: true };
  }

  static async getUnreadCount(userId: string) {
    const result = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return Number(result[0]?.count || 0);
  }

  static async create(userId: string, data: { title: string; message: string; type: string; metadata?: any }) {
    const [notif] = await db.insert(notifications).values({
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      metadata: data.metadata,
    }).returning();
    return notif;
  }
}
