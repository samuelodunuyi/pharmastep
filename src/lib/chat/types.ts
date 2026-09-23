import type { ChatRole, ChatStatus } from "@/generated/prisma/enums";

/** Longest message a customer or pharmacist can send. */
export const MAX_CHAT_MESSAGE_LENGTH = 1000;

export type ChatProduct = {
  id: string;
  slug: string;
  name: string;
  images: string[];
  priceKobo: number;
  stock: number;
};

export type ChatMessageView = {
  id: string;
  role: ChatRole;
  content: string;
  /** Pharmacist's name, for their messages. */
  authorName: string | null;
  createdAt: string;
  products: ChatProduct[];
};

/** What the customer's chat window renders. `status` is null before the first message. */
export type ChatView = {
  status: ChatStatus | null;
  messages: ChatMessageView[];
};

export type ChatRequest = { type: "message"; text: string } | { type: "handover" };
