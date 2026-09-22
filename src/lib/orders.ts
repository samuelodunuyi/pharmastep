import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { initializeTransaction, verifyTransaction } from "@/lib/paystack";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(length: number) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function newOrderReference() {
  return `PS-${randomCode(8)}`;
}

/** Starts (or restarts) a Paystack payment for an unpaid order. Returns the hosted checkout URL. */
export async function startPayment(orderId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status !== "PENDING_PAYMENT") throw new Error("This order is not awaiting payment.");

  const paystackRef = `${order.reference}-${randomCode(4)}`;
  await db.order.update({ where: { id: order.id }, data: { paystackRef } });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const txn = await initializeTransaction({
    email: order.email,
    amountKobo: order.totalKobo,
    reference: paystackRef,
    callbackUrl: `${site}/checkout/callback`,
    metadata: { orderId: order.id, orderReference: order.reference },
  });
  return txn.authorization_url;
}

export type ConfirmResult =
  | { ok: true; orderId: string; alreadyPaid: boolean }
  | { ok: false; reason: string; orderId?: string };

/**
 * Confirms a payment with Paystack and marks the order paid. Safe to call more than once
 * (the redirect callback and the webhook both call it). Never trusts the browser.
 */
export async function confirmPayment(paystackRef: string): Promise<ConfirmResult> {
  const txn = await verifyTransaction(paystackRef);
  // An earlier attempt can be paid after a retry replaced paystackRef, so fall back to the metadata.
  const metaOrderId = typeof txn.metadata?.orderId === "string" ? txn.metadata.orderId : undefined;
  const order = await db.order.findFirst({
    where: { OR: [{ paystackRef }, ...(metaOrderId ? [{ id: metaOrderId }] : [])] },
    include: { items: true },
  });
  if (!order) return { ok: false, reason: "Order not found." };
  if (order.status !== "PENDING_PAYMENT") return { ok: true, orderId: order.id, alreadyPaid: true };

  if (txn.status !== "success") {
    return { ok: false, reason: `Payment ${txn.status}.`, orderId: order.id };
  }
  if (txn.amount !== order.totalKobo || txn.currency !== "NGN") {
    console.error("Paystack amount mismatch", { paystackRef, paid: txn.amount, expected: order.totalKobo });
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        note: `Payment amount mismatch: paid ${txn.amount} kobo ${txn.currency}, expected ${order.totalKobo} kobo NGN. Needs manual review.`,
      },
    });
    return { ok: false, reason: "Payment amount did not match the order. Our team will contact you.", orderId: order.id };
  }

  const alreadyPaid = await db.$transaction(async (tx) => {
    // Conditional update so two concurrent confirmations can't both succeed.
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING_PAYMENT" },
      data: { status: "PAID", paidAt: txn.paid_at ? new Date(txn.paid_at) : new Date(), paystackTxnId: String(txn.id) },
    });
    if (updated.count === 0) return true;

    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        status: "PAID",
        note:
          order.prescriptionStatus === "PENDING_REVIEW"
            ? "Payment received. A pharmacist will review your prescription."
            : "Payment received. We're preparing your order.",
      },
    });
    if (order.sourceCartId) {
      const boughtIds = order.items.map((i) => i.productId).filter((id): id is string => !!id);
      await tx.cartItem.deleteMany({ where: { cartId: order.sourceCartId, productId: { in: boughtIds } } });
    }
    return false;
  });

  return { ok: true, orderId: order.id, alreadyPaid };
}

export const ORDER_FLOW = ["PAID", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
