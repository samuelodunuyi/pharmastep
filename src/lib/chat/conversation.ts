import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth";
import { isAssistantConfigured } from "@/lib/env";
import { runAssistant, type AssistantOutcome, type AssistantTurn } from "@/lib/chat/assistant";
import { CHAT_NOTICES, handoverNotice, looksLikeEmergency, type Handover } from "@/lib/chat/triage";
import type { ChatMessageView, ChatProduct, ChatSource, ChatState, ChatSummary, ChatView } from "@/lib/chat/types";
import type { ChatConversation, ChatRole, Prisma, Profile } from "@/generated/prisma/client";

type Pharmacist = Pick<Profile, "id" | "fullName">;

const GUEST_COOKIE = "chat_guest";
const MESSAGES_PER_MINUTE = 6;
const NEW_CHATS_PER_HOUR = 5;
/** After this many assistant replies, a pharmacist takes over rather than the chat going on indefinitely. */
const MAX_ASSISTANT_REPLIES = 15;
/** How much of the conversation the assistant reads. */
const HISTORY_LIMIT = 30;
const HISTORY_PAGE = 50;

export class ChatError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// ---------- Whose chats ----------

/**
 * The chats this visitor may see: a signed-in customer's own, or a guest's (by cookie).
 * A guest's chats move to their account when they sign in. Chats that belong to an account are never
 * shown through the cookie alone (e.g. on a shared phone after signing out).
 */
async function customerScope(): Promise<{ where: Prisma.ChatConversationWhereInput | null; profileId?: string }> {
  const [profile, guestKey] = await Promise.all([getCurrentProfile(), cookies().then((c) => c.get(GUEST_COOKIE)?.value)]);
  if (profile) {
    if (guestKey) await db.chatConversation.updateMany({ where: { guestKey, profileId: null }, data: { profileId: profile.id } });
    return { where: { profileId: profile.id }, profileId: profile.id };
  }
  return { where: guestKey ? { guestKey, profileId: null } : null };
}

async function findOwnChat(chatId: string) {
  const { where } = await customerScope();
  const chat = where ? await db.chatConversation.findFirst({ where: { ...where, id: chatId } }) : null;
  if (!chat) throw new ChatError("We couldn’t find that chat.", 404);
  return chat;
}

async function guestKeyForNewChat() {
  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value;
  if (existing) return existing;
  const key = randomBytes(24).toString("base64url");
  store.set(GUEST_COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return key;
}

async function clientIpHash() {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip ? createHash("sha256").update(ip).digest("hex") : null;
}

async function startChat() {
  const ipHash = await clientIpHash();
  if (ipHash) {
    const recent = await db.chatConversation.count({
      where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= NEW_CHATS_PER_HOUR) throw new ChatError("You’ve started a lot of chats recently. Please try again later.", 429);
  }
  const { profileId } = await customerScope();
  const guestKey = profileId ? null : await guestKeyForNewChat();
  return db.chatConversation.create({ data: { profileId, guestKey, ipHash } });
}

// ---------- Messages and status ----------

/** Adds a message and marks the chat as active, so it sorts to the top of everyone's lists. */
async function addMessage(chatId: string, role: ChatRole, content: string, extra: { productIds?: string[]; sources?: ChatSource[]; authorId?: string } = {}) {
  await db.chatMessage.create({ data: { conversationId: chatId, role, content, ...extra } });
  await db.chatConversation.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
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
  if (moved.count > 0) await addMessage(chatId, "SYSTEM", handoverNotice(handover.severity));
}

/**
 * A customer writing in a closed chat reopens it: back to the pharmacists if they had been involved,
 * otherwise back to the assistant.
 */
async function reopen(chat: ChatConversation): Promise<ChatConversation> {
  if (!chat.handedOverAt) {
    return db.chatConversation.update({ where: { id: chat.id }, data: { status: "BOT", closedAt: null } });
  }
  const reopened = await db.chatConversation.update({
    where: { id: chat.id },
    data: { status: "WAITING", closedAt: null, pharmacistId: null, handoverReason: "The customer reopened this chat.", handedOverAt: new Date() },
  });
  await addMessage(chat.id, "SYSTEM", CHAT_NOTICES.reopened);
  return reopened;
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
  if (stillWithAssistant) await addMessage(chat.id, "ASSISTANT", outcome.text, { productIds: outcome.productIds, sources: outcome.sources });
}

// ---------- Customer side ----------

/**
 * Stores the customer's message and, while the assistant is handling the chat, answers it.
 * Without `chatId` it starts a new chat; a closed chat is reopened.
 */
export async function sendCustomerMessage(chatId: string | undefined, text: string): Promise<ChatState> {
  let chat = chatId ? await findOwnChat(chatId) : await startChat();
  const recent = await db.chatMessage.count({
    where: { conversationId: chat.id, role: "CUSTOMER", createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
  });
  if (recent >= MESSAGES_PER_MINUTE) throw new ChatError("You’re sending messages too quickly. Please wait a moment.", 429);

  if (chat.status === "CLOSED") chat = await reopen(chat);
  await addMessage(chat.id, "CUSTOMER", text);

  if (chat.status === "BOT") {
    await answerWithAssistant(chat, text);
  } else if (chat.severity !== "EMERGENCY" && looksLikeEmergency(text)) {
    // Already with the pharmacists: move it to the top of their queue and give the same safety advice.
    await db.chatConversation.update({ where: { id: chat.id }, data: { severity: "EMERGENCY" } });
    await addMessage(chat.id, "SYSTEM", handoverNotice("EMERGENCY"));
  }
  return getChatState(chat.id);
}

/** "Talk to a pharmacist" button. */
export async function requestPharmacist(chatId: string): Promise<ChatState> {
  const chat = await findOwnChat(chatId);
  await handOver(chat.id, { severity: null, reason: "The customer asked for a pharmacist." });
  return getChatState(chat.id);
}

async function listChats(where: Prisma.ChatConversationWhereInput): Promise<ChatSummary[]> {
  const chats = await db.chatConversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: HISTORY_PAGE,
    include: { messages: { where: { role: { not: "SYSTEM" } }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const replies = await db.chatMessage.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: chats.map((c) => c.id) }, role: { not: "CUSTOMER" } },
    _max: { createdAt: true },
  });
  const lastReply = new Map(replies.map((r) => [r.conversationId, r._max.createdAt]));

  return chats.map((c) => ({
    id: c.id,
    status: c.status,
    preview: c.messages[0]?.content ?? "",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    lastReplyAt: lastReply.get(c.id)?.toISOString() ?? null,
  }));
}

/**
 * The customer's chat history, plus one chat opened in full: `activeId` if given, otherwise the latest
 * that's still open. Pass `null` to open none (starting a new chat).
 */
export async function getChatState(activeId?: string | null): Promise<ChatState> {
  const { where } = await customerScope();
  if (!where) {
    if (activeId) throw new ChatError("We couldn’t find that chat.", 404);
    return { conversations: [], active: null };
  }
  const conversations = await listChats(where);

  const activeChat =
    activeId === undefined
      ? conversations.find((c) => c.status !== "CLOSED")
      : activeId && (await db.chatConversation.findFirst({ where: { ...where, id: activeId }, select: { id: true, status: true } }));
  if (activeId && !activeChat) throw new ChatError("We couldn’t find that chat.", 404);
  const active: ChatView | null = activeChat
    ? { id: activeChat.id, status: activeChat.status, messages: await loadChatMessages(activeChat.id) }
    : null;
  return { conversations, active };
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
    // Written only by this module, in the ChatSource shape.
    sources: (m.sources as ChatSource[] | null) ?? [],
  }));
}

// ---------- Pharmacist side ----------

export async function joinChat(chatId: string, pharmacist: Pharmacist) {
  const joined = await db.chatConversation.updateMany({
    where: { id: chatId, status: { in: ["BOT", "WAITING"] } },
    data: { status: "WITH_PHARMACIST", pharmacistId: pharmacist.id },
  });
  if (joined.count > 0) await addMessage(chatId, "SYSTEM", CHAT_NOTICES.pharmacistJoined(pharmacist.fullName ?? "A pharmacist"));
}

export async function sendPharmacistMessage(chatId: string, pharmacist: Pharmacist, text: string) {
  const chat = await db.chatConversation.findUnique({ where: { id: chatId }, select: { status: true } });
  if (!chat || chat.status === "CLOSED") throw new ChatError("This chat is closed.", 409);
  if (chat.status !== "WITH_PHARMACIST") await joinChat(chatId, pharmacist);
  await addMessage(chatId, "PHARMACIST", text, { authorId: pharmacist.id });
}

export async function closeChat(chatId: string) {
  const closed = await db.chatConversation.updateMany({
    where: { id: chatId, status: { not: "CLOSED" } },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  if (closed.count > 0) await addMessage(chatId, "SYSTEM", CHAT_NOTICES.closed);
}
