"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat/chat-panel";
import type { ChatMessageView, ChatRequest, ChatView } from "@/lib/chat/types";

const ChatContext = createContext<(() => void) | null>(null);

/** How often to check for a pharmacist's reply while one is handling the chat. */
const POLL_MS = { open: 4_000, closed: 20_000 };

async function chatRequest(body?: ChatRequest, { quiet = false } = {}): Promise<ChatView | null> {
  try {
    const res = await fetch("/api/chat", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (res.ok) return data as ChatView;
    if (!quiet) toast.error(data?.error ?? "Something went wrong. Please try again.");
  } catch {
    if (!quiet) toast.error("Couldn’t reach the chat. Check your connection and try again.");
  }
  return null;
}

/** Provides the "Ask a pharmacist" chat to the storefront: a floating launcher, the chat window and `OpenChatButton`s. */
export function ChatProvider({ assistantEnabled, children }: { assistantEnabled: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ChatView>({ status: null, messages: [] });
  const [busy, setBusy] = useState(false);
  const [seenId, setSeenId] = useState<string>();

  const lastId = view.messages.at(-1)?.id;
  const unread = !open && lastId !== undefined && lastId !== seenId;
  const withPharmacist = view.status === "WAITING" || view.status === "WITH_PHARMACIST";

  const refresh = useCallback(async () => {
    if (document.visibilityState === "hidden") return;
    const next = await chatRequest(undefined, { quiet: true });
    if (next) setView(next);
  }, []);

  // Pick up an existing chat (e.g. waiting for a pharmacist) when the site loads.
  useEffect(() => {
    chatRequest(undefined, { quiet: true }).then((next) => {
      if (!next) return;
      setView(next);
      setSeenId(next.messages.at(-1)?.id);
    });
  }, []);

  useEffect(() => {
    if (!withPharmacist) return;
    const timer = setInterval(refresh, open ? POLL_MS.open : POLL_MS.closed);
    return () => clearInterval(timer);
  }, [withPharmacist, open, refresh]);

  async function post(body: ChatRequest, pending?: ChatMessageView) {
    if (pending) setView((v) => ({ ...v, messages: [...v.messages, pending] }));
    setBusy(true);
    const next = await chatRequest(body);
    setBusy(false);
    if (next) setView(next);
    else if (pending) setView((v) => ({ ...v, messages: v.messages.filter((m) => m.id !== pending.id) }));
    return !!next;
  }

  function send(text: string) {
    const pending: ChatMessageView = {
      id: `pending-${Date.now()}`,
      role: "CUSTOMER",
      content: text,
      authorName: null,
      createdAt: new Date().toISOString(),
      products: [],
    };
    return post({ type: "message", text }, pending);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSeenId(lastId);
  }

  return (
    <ChatContext.Provider value={() => setOpen(true)}>
      {children}
      {!open && (
        <Button
          variant="brand"
          size="xl"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg max-sm:size-14 max-sm:p-0"
          aria-label={unread ? "Ask a pharmacist (new message)" : "Ask a pharmacist"}
        >
          <MessageCircle className="max-sm:size-6" />
          <span className="max-sm:sr-only">Ask a pharmacist</span>
          {unread && <span className="absolute top-0 right-0 size-3.5 rounded-full bg-destructive ring-2 ring-background" />}
        </Button>
      )}
      <ChatPanel
        open={open}
        onOpenChange={onOpenChange}
        view={view}
        busy={busy}
        assistantEnabled={assistantEnabled}
        onSend={send}
        onRequestPharmacist={() => post({ type: "handover" })}
      />
    </ChatContext.Provider>
  );
}

/** A button that opens the chat window. Only works inside the storefront (under ChatProvider). */
export function OpenChatButton({ children = "Ask a pharmacist", ...props }: React.ComponentProps<typeof Button>) {
  const openChat = useContext(ChatContext);
  if (!openChat) throw new Error("OpenChatButton must be used inside ChatProvider.");
  return (
    <Button type="button" onClick={openChat} {...props}>
      {children}
    </Button>
  );
}
