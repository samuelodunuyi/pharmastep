"use server";

import { revalidatePath } from "next/cache";
import { addToCart, setCartQuantity } from "@/lib/cart";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addToCartAction(productId: string, quantity = 1): Promise<ActionResult> {
  try {
    await addToCart(productId, Math.max(1, Math.floor(quantity)));
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not add to cart." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setQuantityAction(productId: string, quantity: number): Promise<ActionResult> {
  await setCartQuantity(productId, Math.floor(quantity));
  revalidatePath("/", "layout");
  return { ok: true };
}
