import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Old site URLs were /product/<firestore id>.
export async function GET(request: Request, ctx: RouteContext<"/product/[id]">) {
  const { id } = await ctx.params;
  const product = await db.product.findFirst({
    where: { OR: [{ firebaseId: id }, { id }] },
    select: { slug: true },
  });
  return NextResponse.redirect(new URL(product ? `/products/${product.slug}` : "/products", request.url), 308);
}
