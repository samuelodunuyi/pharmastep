import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { isAssistantConfigured } from "@/lib/env";
import { runAssistant, type AssistantOutcome, type AssistantTurn } from "@/lib/chat/assistant";
import { CHAT_NOTICES, handoverNotice, looksLikeEmergency, type Handover } from "@/lib/chat/triage";
import type { ChatMessageView, ChatProduct, ChatView } from "@/lib/chat/types";
import type { ChatConversation, Profile } from "@/generated/prisma/client";

type Pharmacist = Pick<Profile, "id" | "fullName">;

const TOKEN_COOKIE = "chat_token";
const MESSAGES_PER_MINUTE = 6;
const NEW_CHATS_PER_HOUR = 5;
/** After this many assistant replies, a pharmacist takes over rather than the chat going on indefinitely. */
const MAX_ASSISTANT_REPLIES = 15;
/** How much of the conversation the assistant reads. */
const HISTORY_LIMIT = 30;

export class ChatError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/**
 * The customer's chat: the one in their cookie, or their latest one if signed in.
 * A chat that belongs to an account is never shown to anyone else, even with the cookie
 * (e.g. on a shared phone after signing out).
 */
async function findConversation() {
  const [profile, token] = await Promise.all([getCurrentProfile(), cookies().then((c) => c.get(TOKEN_COOKIE)?.value)]);
  if (token) {
    const chat = await db.chatConversation.findUnique({ where: { accessToken: token } });
    if (chat && (!chat.profileId || chat.profileId === profile?.id)) return { chat, profile };
  }
  const chat = profile
    ? await db.chatConversation.findFirst({ where: { profileId: profile.id }, orderBy: { createdAt: "desc" } })
    : null;
  return { chat, profile };
}

async function clientIpHash() {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip ? createHash("sha256").update(ip).digest("hex") : null;
}

async function startConversation(profileId: string | undefined) {
  const ipHash = await clientIpHash();
  if (ipHash) {
    const recent = await db.chatConversation.count({
      where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= NEW_CHATS_PER_HOUR) throw new ChatError("You’ve started a lot of chats recently. Please try again later.", 429);
  }
  const accessToken = randomBytes(24).toString("base64url");
  const chat = await db.chatConversation.create({ data: { accessToken, profileId, ipHash } });
  (await cookies()).set(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return chat;
}

/** The customer's open chat, starting a new one if they have none (or the last was closed). */
async function openConversation() {
  const { chat, profile } = await findConversation();
  if (!chat || chat.status === "CLOSED") return startConversation(profile?.id);
  if (profile && !chat.profileId) {
    return db.chatConversation.update({ where: { id: chat.id }, data: { profileId: profile.id } });
  }
  return chat;
}

/** Moves a chat from the assistant to the pharmacists' queue. No-op if it's already there. */
async function handOver(chatId: string, handover: Handover) {
  const moved = await db.chatConversation.updateMany({
    where: { id: chatId, status: "BOT" },
    data: {
      status: "WAITING",
      severity: handover.severity,
      handoverReason: handover.reason,
      handoverNote: handover.note,
      handedOverAt: new Date(),
    },
  });
  if (moved.count > 0) {
    await db.chatMessage.create({ data: { conversationId: chatId, role: "SYSTEM", content: handoverNotice(handover.severity) } });
  }
}

/** The conversation as the assistant sees it: customer and assistant text, with suggested products named. */
async function assistantHistory(chatId: string): Promise<AssistantTurn[]> {
  const recent = await db.chatMessage.findMany({
    where: { conversationId: chatId, role: { in: ["CUSTOMER", "ASSISTANT"] } },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  const productNames = new Map(
    (await db.product.findMany({ where: { id: { in: recent.flatMap((m) => m.productIds) } }, select: { id: true, name: true } }))
      .map((p) => [p.id, p.name]),
  );

  const turns: AssistantTurn[] = [];
  for (const m of recent.reverse()) {
    const role = m.role === "CUSTOMER" ? "user" : "assistant";
    const shown = m.productIds.map((id) => productNames.get(id)).filter(Boolean);
    const content = shown.length ? `${m.content}\n\n(Products shown: ${shown.join("; ")})` : m.content;
    const last = turns.at(-1);
    // The API needs alternating turns; merge back-to-back messages from the same side.
    if (last?.role === role) last.content += `\n\n${content}`;
    else turns.push({ role, content });
  }
  while (turns[0]?.role === "assistant") turns.shift();
  return turns;
}

async function answerWithAssistant(chat: ChatConversation, text: string) {
  if (looksLikeEmergency(text)) {
    return handOver(chat.id, { severity: "EMERGENCY", reason: "Message mentions possible emergency symptoms.", note: text });
  }
  if (!isAssistantConfigured()) {
    return handOver(chat.id, { severity: null, reason: "The assistant isn’t switched on." });
  }
  const replies = await db.chatMessage.count({ where: { conversationId: chat.id, role: "ASSISTANT" } });
  if (replies >= MAX_ASSISTANT_REPLIES) {
    return handOver(chat.id, { severity: null, reason: "Long conversation with the assistant." });
  }

  let outcome: AssistantOutcome;
  try {
    outcome = await runAssistant(await assistantHistory(chat.id));
  } catch (err) {
    console.error("Chat assistant failed", err);
    return handOver(chat.id, { severity: null, reason: "The assistant was unavailable." });
  }

  if (outcome.type === "handover") return handOver(chat.id, outcome.handover);

  // A pharmacist may have taken over while the assistant was thinking; their word wins.
  const stillWithAssistant = await db.chatConversation.count({ where: { id: chat.id, status: "BOT" } });
  if (!stillWithAssistant) return;
  await db.chatMessage.create({
    data: { conversationId: chat.id, role: "ASSISTANT", content: outcome.text, productIds: outcome.productIds },
  });
}

/** Stores the customer's message and, while the assistant is handling the chat, answers it. */
export async function sendCustomerMessage(text: string): Promise<ChatView> {
  const chat = await openConversation();
  const recent = await db.chatMessage.count({
    where: { conversationId: chat.id, role: "CUSTOMER", createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
  });
  if (recent >= MESSAGES_PER_MINUTE) throw new ChatError("You’re sending messages too quickly. Please wait a moment.", 429);

  await db.chatMessage.create({ data: { conversationId: chat.id, role: "CUSTOMER", content: text } });
  await db.chatConversation.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });
  if (chat.status === "BOT") {
    await answerWithAssistant(chat, text);
  } else if (chat.severity !== "EMERGENCY" && looksLikeEmergency(text)) {
    // Already with the pharmacists: move it to the top of their queue and give the same safety advice.
    await db.chatConversation.update({ where: { id: chat.id }, data: { severity: "EMERGENCY" } });
    await db.chatMessage.create({ data: { conversationId: chat.id, role: "SYSTEM", content: handoverNotice("EMERGENCY") } });
  }
  return viewOf(chat.id);
}

/** "Talk to a pharmacist" button. */
export async function requestPharmacist(): Promise<ChatView> {
  const chat = await openConversation();
  await handOver(chat.id, { severity: null, reason: "The customer asked for a pharmacist." });
  return viewOf(chat.id);
}

/** Messages ready to render, with suggested products that are still on sale. Shared by the customer and admin views. */
export async function loadChatMessages(chatId: string): Promise<ChatMessageView[]> {
  const messages = await db.chatMessage.findMany({
    where: { conversationId: chatId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { fullName: true, email: true } } },
  });
  const products = await db.product.findMany({
    where: { id: { in: messages.flatMap((m) => m.productIds) }, isActive: true },
    select: { id: true, slug: true, name: true, images: true, priceKobo: true, stock: true },
  });
  const byId = new Map<string, ChatProduct>(products.map((p) => [p.id, p]));

  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    authorName: m.author ? (m.author.fullName ?? m.author.email) : null,
    createdAt: m.createdAt.toISOString(),
    products: m.productIds.flatMap((id) => byId.get(id) ?? []),
  }));
}

async function viewOf(chatId: string): Promise<ChatView> {
  const { status } = await db.chatConversation.findUniqueOrThrow({ where: { id: chatId }, select: { status: true } });
  return { status, messages: await loadChatMessages(chatId) };
}

export async function getChatView(): Promise<ChatView> {
  const { chat } = await findConversation();
  return chat ? viewOf(chat.id) : { status: null, messages: [] };
}

// ---------- Pharmacist side ----------

export async function joinChat(chatId: string, pharmacist: Pharmacist) {
  const joined = await db.chatConversation.updateMany({
    where: { id: chatId, status: { in: ["BOT", "WAITING"] } },
    data: { status: "WITH_PHARMACIST", pharmacistId: pharmacist.id },
  });
  if (joined.count > 0) {
    await db.chatMessage.create({
      data: { conversationId: chatId, role: "SYSTEM", content: CHAT_NOTICES.pharmacistJoined(pharmacist.fullName ?? "A pharmacist") },
    });
  }
}

export async function sendPharmacistMessage(chatId: string, pharmacist: Pharmacist, text: string) {
  const chat = await db.chatConversation.findUnique({ where: { id: chatId }, select: { status: true } });
  if (!chat || chat.status === "CLOSED") throw new ChatError("This chat is closed.", 409);
  if (chat.status !== "WITH_PHARMACIST") await joinChat(chatId, pharmacist);
  await db.chatMessage.create({ data: { conversationId: chatId, role: "PHARMACIST", content: text, authorId: pharmacist.id } });
  await db.chatConversation.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
}

export async function closeChat(chatId: string) {
  const closed = await db.chatConversation.updateMany({
    where: { id: chatId, status: { not: "CLOSED" } },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  if (closed.count > 0) {
    await db.chatMessage.create({ data: { conversationId: chatId, role: "SYSTEM", content: CHAT_NOTICES.closed } });
  }
}
