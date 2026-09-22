import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";

const CART_COOKIE = "cart_id";
const MAX_QTY = 20;

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          manufacturer: true,
          images: true,
          priceKobo: true,
          stock: true,
          isActive: true,
          requiresPrescription: true,
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
};

async function findCartId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (profile) {
    const cart = await db.cart.findUnique({ where: { profileId: profile.id }, select: { id: true } });
    return cart?.id ?? null;
  }
  const cookieId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cookieId) return null;
  const cart = await db.cart.findFirst({ where: { id: cookieId, profileId: null }, select: { id: true } });
  return cart?.id ?? null;
}

/** Read-only; safe in Server Components. */
export async function getCart() {
  const id = await findCartId();
  if (!id) return null;
  return db.cart.findUnique({ where: { id }, include: cartInclude });
}

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCart>>>;

export async function getCartCount() {
  const id = await findCartId();
  if (!id) return 0;
  const agg = await db.cartItem.aggregate({ where: { cartId: id }, _sum: { quantity: true } });
  return agg._sum.quantity ?? 0;
}

/** Only call from Server Actions / Route Handlers (may set a cookie). */
async function getOrCreateCartId() {
  const existing = await findCartId();
  if (existing) return existing;

  const profile = await getCurrentProfile();
  if (profile) {
    const cart = await db.cart.create({ data: { profileId: profile.id } });
    return cart.id;
  }
  const cart = await db.cart.create({ data: {} });
  (await cookies()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart.id;
}

export async function addToCart(productId: string, quantity = 1) {
  const product = await db.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) throw new Error("This product is no longer available.");

  const cartId = await getOrCreateCartId();
  const current = await db.cartItem.findUnique({ where: { cartId_productId: { cartId, productId } } });
  const next = Math.min((current?.quantity ?? 0) + quantity, MAX_QTY, Math.max(product.stock, 0));
  if (next <= 0) throw new Error("This product is out of stock.");

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity: next },
    update: { quantity: next },
  });
}

export async function setCartQuantity(productId: string, quantity: number) {
  const cartId = await findCartId();
  if (!cartId) return;
  if (quantity <= 0) {
    await db.cartItem.deleteMany({ where: { cartId, productId } });
    return;
  }
  const product = await db.product.findUnique({ where: { id: productId }, select: { stock: true } });
  const capped = Math.min(quantity, MAX_QTY, Math.max(product?.stock ?? 0, 0));
  if (capped <= 0) {
    await db.cartItem.deleteMany({ where: { cartId, productId } });
    return;
  }
  await db.cartItem.updateMany({ where: { cartId, productId }, data: { quantity: capped } });
}

export async function clearCart(cartId: string) {
  await db.cartItem.deleteMany({ where: { cartId } });
}

/** After sign-in: move the guest cart's items into the user's cart. */
export async function mergeGuestCart(profileId: string) {
  const store = await cookies();
  const guestId = store.get(CART_COOKIE)?.value;
  if (!guestId) return;
  store.delete(CART_COOKIE);

  const guest = await db.cart.findFirst({ where: { id: guestId, profileId: null }, include: { items: true } });
  if (!guest) return;

  const userCart = await db.cart.upsert({ where: { profileId }, create: { profileId }, update: {} });
  await db.$transaction([
    ...guest.items.map((item) =>
      db.cartItem.upsert({
        where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
        create: { cartId: userCart.id, productId: item.productId, quantity: item.quantity },
        update: { quantity: { increment: item.quantity } },
      }),
    ),
    db.cart.delete({ where: { id: guest.id } }),
  ]);
}

export function summarizeCart(cart: CartWithItems | null) {
  const items = cart?.items.filter((i) => i.product.isActive) ?? [];
  const subtotalKobo = items.reduce((sum, i) => sum + i.product.priceKobo * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const needsPrescription = items.some((i) => i.product.requiresPrescription);
  return { items, subtotalKobo, count, needsPrescription };
}
