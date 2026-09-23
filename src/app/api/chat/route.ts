import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ChatError, getChatState, requestPharmacist, sendCustomerMessage } from "@/lib/chat/conversation";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat/types";

/** The assistant can take a few model round trips. */
export const maxDuration = 60;

const chatId = z.string().min(1).max(40);

const RequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message"),
    chatId: chatId.optional(),
    text: z
      .string()
      .trim()
      .min(1, "Write a message first.")
      .max(MAX_CHAT_MESSAGE_LENGTH, `Messages can be up to ${MAX_CHAT_MESSAGE_LENGTH} characters.`),
  }),
  z.object({ type: z.literal("handover"), chatId }),
], { error: "Invalid request." });

function failure(err: unknown) {
  if (err instanceof ChatError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error("Chat request failed", err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/**
 * The customer's chats. `?id=` opens that chat, `?id=new` opens none (a new chat),
 * and no `id` opens the latest open chat. Polled while a pharmacist is handling one.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  try {
    return NextResponse.json(await getChatState(id === "new" ? null : (id ?? undefined)));
  } catch (err) {
    return failure(err);
  }
}

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const body = parsed.data;
  try {
    const state = body.type === "message" ? await sendCustomerMessage(body.chatId, body.text) : await requestPharmacist(body.chatId);
    return NextResponse.json(state);
  } catch (err) {
    return failure(err);
  }
}
