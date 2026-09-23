"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { getCart, summarizeCart } from "@/lib/cart";
import { quoteDelivery, type DeliveryQuote } from "@/lib/delivery";
import { newOrderReference, startPayment } from "@/lib/orders";
import { uploadPrescription, validatePrescriptionFile } from "@/lib/storage";
import { emailSchema, fieldErrorsFrom, fullNameSchema, phoneSchema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";
import { isPaymentsConfigured, isStorageConfigured } from "@/lib/env";

const CheckoutSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  phone: phoneSchema,
  addressLine: z.string().trim().min(8, "Enter the full delivery address.").max(200),
  city: z.string().trim().min(2, "Enter the area or city, e.g. Lekki.").max(60),
  deliveryNotes: z.string().trim().max(300).optional(),
});

export async function quoteDeliveryAction(address: string, city: string): Promise<DeliveryQuote> {
  return quoteDelivery(String(address).slice(0, 200), String(city).slice(0, 60));
}

const ORDER_BY_CHAT = "You can still order through the pharmacist chat on this site.";

export async function placeOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  // Refuse before creating anything if the store isn't set up to take this order.
  if (!isPaymentsConfigured()) {
    return { error: `Online payment isn’t available right now. ${ORDER_BY_CHAT}` };
  }

  const parsed = CheckoutSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    phone: String(formData.get("phone") ?? ""),
    addressLine: formData.get("addressLine"),
    city: formData.get("city"),
    deliveryNotes: formData.get("deliveryNotes") || undefined,
  });

  const fieldErrors: Record<string, string> = parsed.success ? {} : fieldErrorsFrom(parsed.error);

  const cart = await getCart();
  const { items, subtotalKobo, needsPrescription } = summarizeCart(cart);
  if (!cart || items.length === 0) return { error: "Your cart is empty." };

  const outOfStock = items.filter((i) => i.quantity > i.product.stock);
  if (outOfStock.length > 0) {
    return {
      error: `Not enough stock for: ${outOfStock.map((i) => `${i.product.name} (${i.product.stock} left)`).join(", ")}. Please update your cart.`,
    };
  }

  if (needsPrescription && !isStorageConfigured()) {
    return { error: `We can’t accept prescription uploads online right now. ${ORDER_BY_CHAT}` };
  }

  const prescription = formData.get("prescription");
  const rxFile = prescription instanceof File ? prescription : null;
  if (needsPrescription) {
    const rxError = validatePrescriptionFile(rxFile);
    if (rxError) fieldErrors.prescription = rxError;
    if (formData.get("consent") !== "on") {
      fieldErrors.consent = "Please confirm the prescription is valid and issued to the patient.";
    }
  }

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  const profile = await getCurrentProfile();
  const quote = await quoteDelivery(data.addressLine, data.city);
  const reference = newOrderReference();

  const order = await db.order.create({
    data: {
      reference,
      profileId: profile?.id,
      email: data.email,
      customerName: data.fullName,
      phone: data.phone,
      addressLine: data.addressLine,
      city: data.city,
      deliveryNotes: data.deliveryNotes,
      deliveryDistanceKm: quote.distanceKm,
      subtotalKobo,
      deliveryFeeKobo: quote.feeKobo,
      totalKobo: subtotalKobo + quote.feeKobo,
      prescriptionStatus: needsPrescription ? "PENDING_REVIEW" : "NOT_REQUIRED",
      sourceCartId: cart.id,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          productName: i.product.name,
          unitPriceKobo: i.product.priceKobo,
          quantity: i.quantity,
          requiresPrescription: i.product.requiresPrescription,
        })),
      },
      events: { create: { status: "PENDING_PAYMENT", note: "Order placed. Waiting for payment." } },
    },
  });

  if (profile && (!profile.phone || !profile.fullName)) {
    await db.profile.update({
      where: { id: profile.id },
      data: { phone: profile.phone ?? data.phone, fullName: profile.fullName ?? data.fullName },
    });
  }

  let paymentUrl: string;
  try {
    if (needsPrescription && rxFile) {
      const filePath = await uploadPrescription(rxFile, reference);
      await db.prescription.create({ data: { orderId: order.id, filePath } });
    }
    paymentUrl = await startPayment(order.id);
  } catch (err) {
    console.error("Checkout failed", err);
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    return { error: "We couldn’t start the payment. Please try again in a moment." };
  }

  redirect(paymentUrl);
}

/** "Pay now" on an unpaid order page. */
export async function retryPaymentAction(formData: FormData) {
  const orderId = String(formData.get("orderId"));
  const token = String(formData.get("token") ?? "");
  const profile = await getCurrentProfile();
  const order = await db.order.findUnique({ where: { id: orderId } });
  const allowed = order && (order.trackingToken === token || (profile && order.profileId === profile.id));
  if (!order || !allowed) redirect("/track");

  const url = await startPayment(order.id);
  redirect(url);
}
