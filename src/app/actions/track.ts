"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";

export async function trackOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!reference || !email) return { error: "Enter your order number and email." };

  const order = await db.order.findFirst({
    where: { reference, email },
    select: { id: true, trackingToken: true },
  });
  if (!order) return { error: "We couldn’t find an order with those details." };

  redirect(`/orders/${order.id}?token=${order.trackingToken}`);
}
