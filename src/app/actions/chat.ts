"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { ChatError, closeChat, joinChat, sendPharmacistMessage } from "@/lib/chat/conversation";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat/types";
import type { FormState } from "@/lib/form-state";

const ReplySchema = z.object({
  chatId: z.string().min(1),
  text: z.string().trim().min(1, "Write a reply first.").max(MAX_CHAT_MESSAGE_LENGTH, `Replies can be up to ${MAX_CHAT_MESSAGE_LENGTH} characters.`),
});

export async function replyToChatAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = ReplySchema.safeParse({ chatId: formData.get("chatId"), text: formData.get("text") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await sendPharmacistMessage(parsed.data.chatId, staff, parsed.data.text);
  } catch (err) {
    if (err instanceof ChatError) return { error: err.message };
    throw err;
  }
  revalidatePath(`/admin/chats/${parsed.data.chatId}`);
  return {};
}

export async function joinChatAction(formData: FormData) {
  const staff = await requireStaff();
  const chatId = String(formData.get("chatId"));
  await joinChat(chatId, staff);
  revalidatePath(`/admin/chats/${chatId}`);
}

export async function closeChatAction(formData: FormData) {
  await requireStaff();
  const chatId = String(formData.get("chatId"));
  await closeChat(chatId);
  revalidatePath(`/admin/chats/${chatId}`);
}
