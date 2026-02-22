import { getApiUrl } from "./query-client";
import { getToken } from "./auth";

export type CallSignallingMessage =
  | { type: "call:peers"; roomId: string; peerIds: string[] }
  | { type: "call:peer-joined"; roomId: string; userId: string }
  | { type: "call:peer-left"; roomId: string; userId: string }
  | { type: "call:room-full"; roomId: string }
  | { type: "call:offer"; fromUserId: string; toUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: "call:answer"; fromUserId: string; toUserId: string; sdp: RTCSessionDescriptionInit }
  | { type: "call:ice"; fromUserId: string; toUserId: string; candidate: RTCIceCandidateInit };

export type OnCallMessage = (msg: CallSignallingMessage) => void;

export function openCallWebSocket(
  onMessage: OnCallMessage,
  onReady?: (send: (msg: object) => void, close: () => void) => void
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  function send(msg: object) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function close() {
    closed = true;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  async function connect() {
    if (closed) return;
    try {
      const token = await getToken();
      if (!token || closed) {
        return;
      }
      const base = getApiUrl();
      const wsProtocol = base.startsWith("https") ? "wss" : "ws";
      const url = new URL(base);
      const wsUrl = `${wsProtocol}://${url.host}/ws?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!closed) onReady?.(send, close);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (
            msg.type?.startsWith("call:") &&
            (msg.type === "call:peers" ||
              msg.type === "call:peer-joined" ||
              msg.type === "call:peer-left" ||
              msg.type === "call:room-full" ||
              msg.type === "call:offer" ||
              msg.type === "call:answer" ||
              msg.type === "call:ice")
          ) {
            onMessage(msg as CallSignallingMessage);
          }
        } catch {
          // ignore invalid JSON
        }
      };

      ws.onerror = () => {
        if (!closed) {
          reconnectTimeout = setTimeout(connect, 2000);
        }
      };

      ws.onclose = () => {
        ws = null;
        if (!closed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    } catch {
      if (!closed) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }
  }

  connect();

  return close;
}
