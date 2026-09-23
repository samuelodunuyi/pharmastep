"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { ChatThread } from "@/components/chat/chat-thread";
import { CHAT_STATUS_LABEL } from "@/lib/format";
import { MAX_CHAT_MESSAGE_LENGTH, type ChatView } from "@/lib/chat/types";

type ChatPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: ChatView;
  busy: boolean;
  assistantEnabled: boolean;
  onSend: (text: string) => Promise<boolean>;
  onRequestPharmacist: () => void;
};

export function ChatPanel({ open, onOpenChange, view, busy, assistantEnabled, onSend, onRequestPharmacist }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const withAssistant = assistantEnabled && (view.status === null || view.status === "BOT" || view.status === "CLOSED");

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [open, view.messages.length, busy]);

  async function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    if (!(await onSend(text))) setDraft(text);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Ask a pharmacist</SheetTitle>
          <SheetDescription>
            {view.status && view.status !== "BOT" ? CHAT_STATUS_LABEL[view.status] : withAssistant ? "PharmaStep assistant · a pharmacist can take over any time" : "Our pharmacists reply here"}
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          <p className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm">
            {withAssistant
              ? "Hi! Tell me what’s bothering you and who it’s for. I can suggest something for minor ailments, and I’ll bring in one of our pharmacists for anything more."
              : "Hi! Tell us what you need and one of our pharmacists will reply here."}
          </p>
          <ChatThread messages={view.messages} viewer="customer" />
          {busy && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner /> {view.status === "BOT" || view.status === null ? "Typing…" : "Sending…"}
            </p>
          )}
        </div>

        <div className="space-y-2 border-t p-3">
          {withAssistant && view.messages.length > 0 && view.status !== "CLOSED" && (
            <Button variant="outline" size="sm" onClick={onRequestPharmacist} disabled={busy}>
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
                placeholder="Type your message"
                aria-label="Message"
                maxLength={MAX_CHAT_MESSAGE_LENGTH}
                rows={2}
                className="max-h-32"
              />
              <InputGroupAddon align="block-end" className="justify-end">
                <InputGroupButton type="submit" variant="brand" size="icon-sm" disabled={busy || !draft.trim()} aria-label="Send">
                  <SendHorizontal />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
          <p className="text-[11px] text-muted-foreground">Not for emergencies. If someone is seriously unwell, call 112 or go to the nearest hospital.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
