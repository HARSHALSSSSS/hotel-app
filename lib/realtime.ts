import { getApiUrl } from "./query-client";
import { getToken } from "./auth";

export type RealtimeMessage =
  | { type: "connected"; userId: string }
  | { type: "error"; message: string }
  | { type: "booking:created"; data: { bookingId: string; userId: string; hotelId: string; status: string } }
  | { type: "booking:cancelled"; data: { bookingId: string; userId: string; hotelId: string } }
  | { type: "booking:status_changed"; data: { bookingId: string; userId: string; status: string } }
  | {
      type: "call:incoming";
      callId: string;
      hotelId: string;
      hotelName: string;
      fromUserId: string;
      fromName: string;
    }
  | {
      type: "chat:message";
      data: {
        id: string;
        conversationId: string;
        senderId: string;
        senderName?: string;
        senderAvatar?: string | null;
        content: string;
        type: string;
        createdAt: string;
      };
    };

export type OnRealtimeMessage = (msg: RealtimeMessage) => void;

export function connectRealtime(onMessage: OnRealtimeMessage): () => void {
  let ws: WebSocket | null = null;
  let closed = false;

  async function connect() {
    try {
      const token = await getToken();
      if (!token || closed) return;

      const base = getApiUrl();
      const wsProtocol = base.startsWith("https") ? "wss" : "ws";
      const url = new URL(base);
      const wsUrl = `${wsProtocol}://${url.host}/ws?token=${encodeURIComponent(token)}`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Connection opened; server may send { type: "connected" }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as RealtimeMessage;
          onMessage(msg);
        } catch {
          // ignore non-JSON
        }
      };

      ws.onerror = () => {
        // Reconnect after a delay
        if (!closed) setTimeout(connect, 3000);
      };

      ws.onclose = () => {
        ws = null;
        if (!closed) setTimeout(connect, 5000);
      };
    } catch {
      if (!closed) setTimeout(connect, 5000);
    }
  }

  connect();

  return () => {
    closed = true;
    if (ws) {
      ws.close();
      ws = null;
    }
  };
}
