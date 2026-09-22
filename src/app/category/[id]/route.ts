import { NextResponse } from "next/server";
import { slugify } from "@/lib/format";

// Old site URLs were /category/<Firestore product_type>, e.g. /category/Anti_Malarials.
export async function GET(request: Request, ctx: RouteContext<"/category/[id]">) {
  const { id } = await ctx.params;
  return NextResponse.redirect(new URL(`/categories/${slugify(id)}`, request.url), 308);
}
