import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.paystack.co";

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status) {
    throw new Error(`Paystack ${path} failed: ${body?.message ?? res.statusText}`);
  }
  return body.data as T;
}

export function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return paystack<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    },
  );
}

export type PaystackTransaction = {
  id: number;
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "processing" | "reversed";
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  metadata: Record<string, unknown> | null;
};

export function verifyTransaction(reference: string) {
  return paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function refundTransaction(reference: string, merchantNote?: string) {
  return paystack<{ status: string }>("/refund", {
    method: "POST",
    body: JSON.stringify({ transaction: reference, merchant_note: merchantNote }),
  });
}

/** Webhooks are signed with HMAC-SHA512 of the raw body using the secret key. */
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
