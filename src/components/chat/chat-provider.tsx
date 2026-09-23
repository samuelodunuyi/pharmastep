"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, MessageCircle, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChatConversation, chatStatusLine } from "@/components/chat/chat-conversation";
import { ChatContext, useChat, type ChatContextValue } from "@/components/chat/chat-context";
import { CHATS_PAGE, type ChatMessageView, type ChatRequest, type ChatState } from "@/lib/chat/types";

/** How often to check for a pharmacist's reply while one is handling a chat. */
const POLL_MS = { visible: 4_000, hidden: 20_000 };
const SEEN_STORAGE_KEY = "chat-seen";

async function chatRequest(input: { id?: string | null; body?: ChatRequest }, { quiet = false } = {}): Promise<ChatState | null> {
  try {
    const query = input.id === undefined ? "" : `?id=${encodeURIComponent(input.id ?? "new")}`;
    const res = await fetch(
      `/api/chat${query}`,
      input.body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input.body) } : { cache: "no-store" },
    );
    const data = await res.json().catch(() => null);
    if (res.ok) return data as ChatState;
    if (!quiet) toast.error(data?.error ?? "Something went wrong. Please try again.");
  } catch {
    if (!quiet) toast.error("Couldn’t reach the chat. Check your connection and try again.");
  }
  return null;
}

// "Seen" markers are a per-browser convenience for the new-message dots; losing them is harmless.
function readSeen(): Record<string, string> | null {
  try {
    return JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}
function writeSeen(seen: Record<string, string>) {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seen));
  } catch {}
}

/**
 * The "Ask a pharmacist" chat for the storefront: one shared state behind the floating chat window,
 * the chats page and every OpenChatButton.
 */
export function ChatProvider({ assistantEnabled, children }: { assistantEnabled: boolean; children: React.ReactNode }) {
  const onChatsPage = usePathname() === CHATS_PAGE;
  const [windowOpen, setWindowOpen] = useState(false);
  const [state, setState] = useState<ChatState>({ conversations: [], active: null });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seen, setSeen] = useState<Record<string, string>>({});

  const visible = onChatsPage || windowOpen;
  // Empty while the first message of a new chat is on its way.
  const activeId = state.active?.id || null;
  // Lets the polling timer and request callbacks read the latest values without restarting.
  const latest = useRef({ visible, activeId, sending: busy });
  useEffect(() => {
    latest.current = { visible, activeId, sending: busy };
  });

  const markSeen = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    setSeen((prev) => {
      const next = { ...prev, ...Object.fromEntries(ids.map((id) => [id, now])) };
      writeSeen(next);
      return next;
    });
  }, []);

  const apply = useCallback(
    (next: ChatState) => {
      setState(next);
      if (latest.current.visible && next.active) markSeen([next.active.id]);
    },
    [markSeen],
  );

  // Load the history once. On a browser that hasn't recorded anything yet, count existing replies as seen.
  useEffect(() => {
    chatRequest({}, { quiet: true }).then((next) => {
      if (!next) return;
      const stored = readSeen();
      if (stored) setSeen(stored);
      else markSeen(next.conversations.map((c) => c.id));
      apply(next);
    });
  }, [markSeen, apply]);

  const live = state.conversations.some((c) => c.status === "WAITING" || c.status === "WITH_PHARMACIST");
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(async () => {
      if (document.visibilityState === "hidden" || latest.current.sending) return;
      const requested = latest.current.activeId;
      const next = await chatRequest({ id: requested }, { quiet: true });
      // Drop it if the customer switched chats or sent a message while it was loading.
      if (next && latest.current.activeId === requested && !latest.current.sending) apply(next);
    }, visible ? POLL_MS.visible : POLL_MS.hidden);
    return () => clearInterval(timer);
  }, [live, visible, apply]);

  async function post(body: ChatRequest, pending?: ChatMessageView) {
    if (pending) {
      setState((s) => ({ ...s, active: { id: s.active?.id ?? "", status: s.active?.status ?? "BOT", messages: [...(s.active?.messages ?? []), pending] } }));
    }
    setBusy(true);
    const next = await chatRequest({ body });
    setBusy(false);
    if (next) apply(next);
    else if (pending) {
      setState((s) => ({ ...s, active: s.active?.id ? { ...s.active, messages: s.active.messages.filter((m) => m.id !== pending.id) } : null }));
    }
    return !!next;
  }

  function showWindow() {
    if (onChatsPage) return;
    setWindowOpen(true);
    if (activeId) markSeen([activeId]);
  }

  const value: ChatContextValue = {
    state,
    busy,
    loading,
    assistantEnabled,
    openChat: showWindow,
    selectChat: async (id) => {
      if (id === activeId) return;
      if (id === null) return setState((s) => ({ ...s, active: null }));
      // Sending waits until the chosen chat has loaded, so a message can't land in the previous one.
      setLoading(true);
      const next = await chatRequest({ id });
      setLoading(false);
      if (next) apply(next);
    },
    send: (text) =>
      post(
        { type: "message", chatId: activeId || undefined, text },
        { id: `pending-${Date.now()}`, role: "CUSTOMER", content: text, authorName: null, createdAt: new Date().toISOString(), products: [], sources: [] },
      ),
    requestPharmacist: () => {
      if (activeId) post({ type: "handover", chatId: activeId });
    },
    isUnread: (c) => !!c.lastReplyAt && c.lastReplyAt > (seen[c.id] ?? "") && !(visible && c.id === activeId),
  };

  const unread = state.conversations.some(value.isUnread);

  return (
    <ChatContext.Provider value={value}>
      {children}
      {!visible && (
        <Button
          variant="brand"
          size="xl"
          onClick={showWindow}
          className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg max-sm:size-14 max-sm:p-0"
          aria-label={unread ? "Ask a pharmacist (new message)" : "Ask a pharmacist"}
        >
          <MessageCircle className="max-sm:size-6" />
          <span className="max-sm:sr-only">Ask a pharmacist</span>
          {unread && <span className="absolute top-0 right-0 size-3.5 rounded-full bg-destructive ring-2 ring-background" />}
        </Button>
      )}
      <Sheet
        open={windowOpen && !onChatsPage}
        onOpenChange={setWindowOpen}
      >
        <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>Ask a pharmacist</SheetTitle>
            <SheetDescription>{chatStatusLine(state.active, assistantEnabled)}</SheetDescription>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => value.selectChat(null)} disabled={busy || !state.active}>
                <SquarePen /> New chat
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={CHATS_PAGE} onClick={() => setWindowOpen(false)}><History /> All chats</Link>
              </Button>
            </div>
          </SheetHeader>
          <ChatConversation />
        </SheetContent>
      </Sheet>
    </ChatContext.Provider>
  );
}

/** A button that opens the chat. Only works inside the storefront (under ChatProvider). */
export function OpenChatButton({ children = "Ask a pharmacist", ...props }: React.ComponentProps<typeof Button>) {
  const { openChat } = useChat();
  return (
    <Button type="button" onClick={openChat} {...props}>
      {children}
    </Button>
  );
}
