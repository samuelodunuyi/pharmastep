"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useChat } from "@/components/chat/chat-context";
import { ChatThread } from "@/components/chat/chat-thread";
import { CHAT_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MAX_CHAT_MESSAGE_LENGTH, type ChatView } from "@/lib/chat/types";

/** One-line description of who the customer is talking to. */
export function chatStatusLine(chat: ChatView | null, assistantEnabled: boolean) {
  if (chat && chat.status !== "BOT") return CHAT_STATUS_LABEL[chat.status];
  return assistantEnabled ? "PharmaStep assistant · a pharmacist can take over any time" : "Our pharmacists reply here";
}

/**
 * The open chat (or a new one) with the message box. Used by the floating chat window and the chats page;
 * it fills its parent, which should be a flex column with a fixed height.
 */
export function ChatConversation({ className }: { className?: string }) {
  const { state, busy, loading, assistantEnabled, send, requestPharmacist } = useChat();
  const chat = state.active;
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const withAssistant = assistantEnabled && (!chat || chat.status === "BOT");

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.id, chat?.messages.length, busy]);

  async function submit() {
    const text = draft.trim();
    if (!text || busy || loading) return;
    setDraft("");
    if (!(await send(text))) setDraft(text);
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm">
          {withAssistant
            ? "Hi! Tell me what’s bothering you and who it’s for. I can suggest something for minor ailments, and I’ll bring in one of our pharmacists for anything more."
            : "Hi! Tell us what you need and one of our pharmacists will reply here."}
        </p>
        {chat && <ChatThread messages={chat.messages} viewer="customer" />}
        {(busy || loading) && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Spinner /> {loading ? "Loading…" : withAssistant ? "Typing…" : "Sending…"}
          </p>
        )}
      </div>

      <div className="space-y-2 border-t p-3">
        {withAssistant && chat?.id && (
          <Button variant="outline" size="sm" onClick={requestPharmacist} disabled={busy}>
            <UserRound /> Talk to a pharmacist instead
          </Button>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <InputGroup>
            <InputGroupTextarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={chat?.status === "CLOSED" ? "Write here to reopen this chat" : "Type your message"}
              aria-label="Message"
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              rows={2}
              className="max-h-32"
            />
            <InputGroupAddon align="block-end" className="justify-end">
              <InputGroupButton type="submit" variant="brand" size="icon-sm" disabled={busy || loading || !draft.trim()} aria-label="Send">
                <SendHorizontal />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
        <p className="text-[11px] text-muted-foreground">Not for emergencies. If someone is seriously unwell, call 112 or go to the nearest hospital.</p>
      </div>
    </div>
  );
}
