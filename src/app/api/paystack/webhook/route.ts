import { NextResponse, type NextRequest } from "next/server";
import { isValidWebhookSignature } from "@/lib/paystack";
import { confirmPayment } from "@/lib/orders";

// Set this URL in Paystack: Settings -> API Keys & Webhooks -> Webhook URL
// https://<your-domain>/api/paystack/webhook
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!isValidWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(raw) as { event: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      // Re-verifies with Paystack's API rather than trusting the webhook body.
      await confirmPayment(event.data.reference);
    } catch (err) {
      console.error("Webhook confirmation failed", err);
      return new NextResponse("Retry later", { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
