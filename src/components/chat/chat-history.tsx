"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessagesSquare, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ChatStatusBadge } from "@/components/chat/chat-badges";
import { useChat } from "@/components/chat/chat-context";
import { ChatConversation, chatStatusLine } from "@/components/chat/chat-conversation";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The chats page: history on the left, the open chat on the right (one at a time on phones). */
export function ChatHistory({ signedIn }: { signedIn: boolean }) {
  const { state, busy, assistantEnabled, selectChat, isUnread } = useChat();
  const [phoneShowsChat, setPhoneShowsChat] = useState(false);
  const hasHistory = state.conversations.length > 0;
  const showChat = phoneShowsChat || !hasHistory;

  function open(id: string | null) {
    selectChat(id);
    setPhoneShowsChat(true);
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        title="Your chats"
        description={
          signedIn ? (
            "Pick up an earlier conversation or start a new one."
          ) : (
            <>
              Chats are saved on this device. <Link href="/login?next=/chats" className="font-medium text-primary hover:underline">Sign in</Link> to keep them with your account.
            </>
          )
        }
        actions={
          <Button variant="brand" size="lg" onClick={() => open(null)} disabled={busy}>
            <SquarePen /> New chat
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <Card className={cn("gap-0 self-start py-0", showChat && "max-md:hidden")}>
          {hasHistory ? (
            <ul className="max-h-[70vh] divide-y overflow-y-auto">
              {state.conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => open(c.id)}
                    aria-current={c.id === state.active?.id || undefined}
                    className="flex w-full flex-col gap-1.5 p-4 text-left hover:bg-accent aria-[current]:bg-secondary"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <ChatStatusBadge status={c.status} />
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {isUnread(c) && <span className="size-2 rounded-full bg-brand" aria-label="New message" />}
                        {formatDate(c.updatedAt)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-sm">{c.preview || "No messages yet"}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={MessagesSquare} title="No chats yet" description="Your conversations will appear here." className="py-10" />
          )}
        </Card>

        <Card className={cn("h-[70vh] min-h-[480px] gap-0 py-0", !showChat && "max-md:hidden")}>
          <div className="flex items-center gap-2 border-b px-4 py-3">
            {hasHistory && (
              <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setPhoneShowsChat(false)} aria-label="Back to your chats">
                <ArrowLeft />
              </Button>
            )}
            <div className="min-w-0">
              <p className="font-semibold">{state.active ? `Chat started ${formatDate(state.active.messages[0]?.createdAt ?? new Date())}` : "New chat"}</p>
              <p className="truncate text-sm text-muted-foreground">{chatStatusLine(state.active, assistantEnabled)}</p>
            </div>
          </div>
          <ChatConversation />
        </Card>
      </div>
    </div>
  );
}
