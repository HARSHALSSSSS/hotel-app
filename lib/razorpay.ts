import { Platform } from "react-native";
import { authFetch } from "./auth";

export interface CreateOrderResponse {
  orderId: string;
  key: string;
  amount: number;
  currency: string;
}

export interface BookingDataForPayment {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
}

export async function createRazorpayOrder(
  amountINR: number,
  bookingData: BookingDataForPayment
): Promise<CreateOrderResponse> {
  const res = await authFetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountINR, bookingData }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create order");
  }
  return res.json();
}

export async function verifyRazorpayPayment(body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingData: BookingDataForPayment;
}): Promise<unknown> {
  const res = await authFetch("/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Payment verification failed");
  }
  return res.json();
}

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      order_id: string;
      amount: number;
      currency: string;
      name?: string;
      description?: string;
      handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
      modal?: { ondismiss: () => void };
    }) => { open: () => void };
  }
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Document not available"));
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.head.appendChild(script);
  });
}

export type UPIApp = "phonepe" | "gpay";

export interface OpenCheckoutOptions {
  key: string;
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  bookingData: BookingDataForPayment;
  onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void | Promise<void>;
  onClose?: () => void;
  /** Pre-select UPI and optionally open specific app: phonepe (Phone Pay) or gpay (Google Pay) */
  upiApp?: UPIApp;
  /** Prefill contact (phone) for UPI - improves UX */
  prefillContact?: string;
}

export async function openRazorpayCheckout(options: OpenCheckoutOptions): Promise<void> {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    try {
      const RazorpayCheckout = require("react-native-razorpay").default;
      const checkoutOptions: Record<string, unknown> = {
        key: options.key,
        order_id: options.orderId,
        amount: String(options.amount),
        currency: options.currency,
        name: options.name || "Hotel Booking Hub",
        description: options.description || "Booking payment",
        prefill: { email: "", contact: options.prefillContact || "" },
        theme: { color: "#0066CC" },
      };
      if (options.upiApp) {
        checkoutOptions.method = "upi";
      }
      RazorpayCheckout.open(checkoutOptions)
        .then((data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          options.onSuccess({
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
          });
        })
        .catch((err: { code?: number; description?: string }) => {
          const isUserCancel = err.code === 0 || err.code === 2;
          options.onClose?.();
          if (!isUserCancel && err.description) {
            console.warn("Razorpay error:", err.description);
          }
        });
    } catch (e) {
      const msg = (e as Error).message || "";
      if (msg.includes("native") || msg.includes("module")) {
        throw new Error("Card payment requires a device build. Run: npx expo prebuild && npx expo run:ios (or run:android).");
      }
      throw e;
    }
    return;
  }

  if (typeof window === "undefined") {
    throw new Error("Razorpay Checkout is only available in the browser or in the app.");
  }
  await loadScript(CHECKOUT_SCRIPT);
  const Razorpay = window.Razorpay;
  if (!Razorpay) {
    throw new Error("Razorpay not loaded.");
  }

  const rzpOptions: Record<string, unknown> = {
    key: options.key,
    order_id: options.orderId,
    amount: options.amount,
    currency: options.currency,
    name: options.name || "Hotel Booking Hub",
    description: options.description || "Booking payment",
    handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        options.onClose?.();
      },
    },
  };
  if (options.upiApp) {
    rzpOptions.method = "upi";
  }
  const rzp = new Razorpay(rzpOptions as any);
  rzp.open();
}
