import { db } from "../db";
import { chatConversations, chatMessages, users } from "@shared/schema";
import { eq, or, and, desc, asc } from "drizzle-orm";

export type MessageType = "text" | "image" | "audio";

export class ChatService {
  static async getOrCreateConversation(user1Id: string, user2Id: string) {
    const [u1, u2] = [user1Id, user2Id].sort();
    const existing = await db
      .select()
      .from(chatConversations)
      .where(
        or(
          and(eq(chatConversations.user1Id, u1), eq(chatConversations.user2Id, u2)),
          and(eq(chatConversations.user1Id, u2), eq(chatConversations.user2Id, u1))
        )
      )
      .limit(1);
    if (existing[0]) return existing[0];
    const [created] = await db
      .insert(chatConversations)
      .values({ user1Id: u1, user2Id: u2 })
      .returning();
    return created;
  }

  static async getConversationsForUser(userId: string) {
    const convos = await db
      .select()
      .from(chatConversations)
      .where(or(eq(chatConversations.user1Id, userId), eq(chatConversations.user2Id, userId)))
      .orderBy(desc(chatConversations.lastMessageAt));

    const withOther = await Promise.all(
      convos.map(async (c) => {
        const otherId = c.user1Id === userId ? c.user2Id : c.user1Id;
        const [other] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
        const [lastMsg] = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, c.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);
        return {
          id: c.id,
          otherUser: other ? { id: other.id, name: other.name, avatar: other.avatar } : null,
          lastMessage: lastMsg ? { content: lastMsg.content, type: lastMsg.type, createdAt: lastMsg.createdAt } : null,
          lastMessageAt: c.lastMessageAt || c.createdAt,
        };
      })
    );
    return withOther;
  }

  static async getMessages(conversationId: string, userId: string, limit = 50, before?: Date) {
    const [convo] = await db.select().from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1);
    if (!convo || (convo.user1Id !== userId && convo.user2Id !== userId)) return [];
    let q = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    const rows = await q;
    const withSender = await Promise.all(
      rows.map(async (m) => {
        const [sender] = await db.select({ id: users.id, name: users.name, avatar: users.avatar }).from(users).where(eq(users.id, m.senderId)).limit(1);
        return {
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: sender?.name,
          senderAvatar: sender?.avatar,
          content: m.content,
          type: m.type,
          createdAt: m.createdAt,
        };
      })
    );
    return withSender.reverse();
  }

  static async createMessage(conversationId: string, senderId: string, content: string, type: MessageType = "text") {
    const [convo] = await db.select().from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1);
    if (!convo || (convo.user1Id !== senderId && convo.user2Id !== senderId)) throw new Error("Conversation not found");
    const recipientId = convo.user1Id === senderId ? convo.user2Id : convo.user1Id;
    const [msg] = await db
      .insert(chatMessages)
      .values({ conversationId, senderId, content, type })
      .returning();
    await db
      .update(chatConversations)
      .set({ lastMessageAt: msg.createdAt })
      .where(eq(chatConversations.id, conversationId));
    const [sender] = await db.select({ name: users.name, avatar: users.avatar }).from(users).where(eq(users.id, senderId)).limit(1);
    return {
      ...msg,
      senderName: sender?.name,
      senderAvatar: sender?.avatar,
      recipientId,
    };
  }

  static async getOtherUser(conversationId: string, userId: string) {
    const [c] = await db.select().from(chatConversations).where(eq(chatConversations.id, conversationId)).limit(1);
    if (!c) return null;
    const otherId = c.user1Id === userId ? c.user2Id : c.user1Id;
    const [u] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
    return u;
  }
}
