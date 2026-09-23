import { NextResponse } from "next/server";
import { z } from "zod";
import { ChatError, getChatView, requestPharmacist, sendCustomerMessage } from "@/lib/chat/conversation";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat/types";

/** The assistant can take a few model round trips. */
export const maxDuration = 60;

const RequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message"),
    text: z
      .string()
      .trim()
      .min(1, "Write a message first.")
      .max(MAX_CHAT_MESSAGE_LENGTH, `Messages can be up to ${MAX_CHAT_MESSAGE_LENGTH} characters.`),
  }),
  z.object({ type: z.literal("handover") }),
], { error: "Invalid request." });

function failure(err: unknown) {
  if (err instanceof ChatError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("Chat request failed", err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** The customer's current chat (polled while a pharmacist is handling it). */
export async function GET() {
  try {
    return NextResponse.json(await getChatView());
  } catch (err) {
    return failure(err);
  }
}

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  try {
    const view = parsed.data.type === "message" ? await sendCustomerMessage(parsed.data.text) : await requestPharmacist();
    return NextResponse.json(view);
  } catch (err) {
    return failure(err);
  }
}
