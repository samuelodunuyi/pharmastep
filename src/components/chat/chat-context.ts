"use client";

import { createContext, useContext } from "react";
import type { ChatState, ChatSummary } from "@/lib/chat/types";

export type ChatContextValue = {
  state: ChatState;
  /** A message is being sent (and answered). */
  busy: boolean;
  /** A chat from the history is loading. */
  loading: boolean;
  assistantEnabled: boolean;
  /** Opens the chat window (on the chats page, the page itself is the chat). */
  openChat: () => void;
  /** Shows a chat from the history, or `null` for a new one. */
  selectChat: (id: string | null) => void;
  send: (text: string) => Promise<boolean>;
  requestPharmacist: () => void;
  isUnread: (chat: ChatSummary) => boolean;
};

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside ChatProvider.");
  return value;
}
