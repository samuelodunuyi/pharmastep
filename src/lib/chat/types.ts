import type { ChatRole, ChatStatus } from "@/generated/prisma/enums";

/** The customer's chat history page. */
export const CHATS_PAGE = "/chats";

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

/** A place an assistant reply took information from, shown as a pill. `url` makes it a link. */
export type ChatSource = { label: string; url?: string };

/** Set on a reply that used the product search. */
export const CATALOGUE_SOURCE: ChatSource = { label: "PharmaStep catalogue", url: "/products" };

export type ChatMessageView = {
  id: string;
  role: ChatRole;
  content: string;
  /** Pharmacist's name, for their messages. */
  authorName: string | null;
  createdAt: string;
  products: ChatProduct[];
  /** Assistant replies only. Anything not covered here comes from the model's general knowledge. */
  sources: ChatSource[];
};

export type ChatView = {
  id: string;
  status: ChatStatus;
  messages: ChatMessageView[];
};

/** One row in the customer's chat history. */
export type ChatSummary = {
  id: string;
  status: ChatStatus;
  /** The latest customer, assistant or pharmacist message. */
  preview: string;
  createdAt: string;
  updatedAt: string;
  /** When the assistant, a pharmacist or the app last posted, for "new message" dots. */
  lastReplyAt: string | null;
};

/** The customer's chats, newest first, and the one they have open (null when starting a new chat). */
export type ChatState = {
  conversations: ChatSummary[];
  active: ChatView | null;
};

/** Without `chatId`, the message starts a new chat. */
export type ChatRequest = { type: "message"; chatId?: string; text: string } | { type: "handover"; chatId: string };
