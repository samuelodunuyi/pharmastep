import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { confirmPayment, type ConfirmResult } from "@/lib/orders";

// Paystack redirects the customer here after the hosted payment page.
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref");
  if (!ref) return NextResponse.redirect(new URL("/track", request.url));

  let result: ConfirmResult;
  try {
    result = await confirmPayment(ref);
  } catch (err) {
    console.error("Payment confirmation failed", err);
    result = { ok: false, reason: "Could not reach Paystack." };
  }

  const order = await db.order.findFirst({
    where: result.orderId ? { id: result.orderId } : { paystackRef: ref },
    select: { id: true, trackingToken: true },
  });
  if (!order) return NextResponse.redirect(new URL("/track", request.url));

  const url = new URL(`/orders/${order.id}`, request.url);
  url.searchParams.set("token", order.trackingToken);
  url.searchParams.set("payment", result.ok ? "success" : "failed");
  return NextResponse.redirect(url);
}
