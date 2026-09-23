import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SendHorizontal } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { AutoRefresh } from "@/components/ui/auto-refresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { TextareaField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { ChatSeverityBadge, ChatStatusBadge } from "@/components/chat/chat-badges";
import { ChatThread } from "@/components/chat/chat-thread";
import { closeChatAction, joinChatAction, replyToChatAction } from "@/app/actions/chat";
import { requireStaff } from "@/lib/auth";
import { loadChatMessages } from "@/lib/chat/conversation";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat/types";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Chat" };

export default async function AdminChatPage(props: PageProps<"/admin/chats/[id]">) {
  await requireStaff();
  const { id } = await props.params;
  const chat = await db.chatConversation.findUnique({
    where: { id },
    include: {
      profile: { select: { fullName: true, email: true, phone: true } },
      pharmacist: { select: { fullName: true, email: true } },
    },
  });
  if (!chat) notFound();
  const owner = chat.profileId ? { profileId: chat.profileId } : chat.guestKey ? { guestKey: chat.guestKey } : null;
  const [messages, otherChats] = await Promise.all([
    loadChatMessages(chat.id),
    owner ? db.chatConversation.findMany({ where: { ...owner, id: { not: chat.id } }, orderBy: { updatedAt: "desc" }, take: 10 }) : [],
  ]);

  const customer = chat.profile ? (chat.profile.fullName ?? chat.profile.email) : "Guest";
  const open = chat.status !== "CLOSED";

  return (
    <div className="max-w-5xl">
      {open && <AutoRefresh seconds={5} />}
      <PageHeader
        size="sm"
        title={customer}
        breadcrumbs={[{ label: "Chats", href: "/admin/chats" }, { label: customer }]}
        description={`Started ${formatDate(chat.createdAt)}${chat.pharmacist ? ` · With ${chat.pharmacist.fullName ?? chat.pharmacist.email}` : ""}`}
        actions={
          <div className="flex gap-2">
            <ChatSeverityBadge severity={chat.severity} />
            <ChatStatusBadge status={chat.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="space-y-6">
            <ChatThread messages={messages} viewer="pharmacist" />
            {open && (
              <ActionForm action={replyToChatAction} message="top" resetOnSuccess className="border-t pt-4">
                <input type="hidden" name="chatId" value={chat.id} />
                <TextareaField
                  name="text"
                  label="Reply"
                  rows={3}
                  maxLength={MAX_CHAT_MESSAGE_LENGTH}
                  description={chat.status === "WITH_PHARMACIST" ? "The customer sees this in their chat window." : "Replying takes the chat over from the assistant."}
                />
                <SubmitButton size="lg" className="mt-3" icon={<SendHorizontal />}>Send</SubmitButton>
              </ActionForm>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {chat.handoverReason && (
            <Card className="ring-brand/20">
              <CardHeader>
                <CardTitle>Why it was handed over</CardTitle>
                <CardDescription>{chat.handedOverAt && formatDate(chat.handedOverAt)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{chat.handoverReason}</p>
                {chat.handoverNote && <p className="rounded-lg bg-muted p-3 whitespace-pre-line text-muted-foreground">{chat.handoverNote}</p>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>{chat.profile ? "Registered customer" : "Guest; they can only be reached in this chat."}</CardDescription>
            </CardHeader>
            {chat.profile && (
              <CardContent className="space-y-1 text-sm">
                <p>{chat.profile.email}</p>
                {chat.profile.phone && <p>{chat.profile.phone}</p>}
                <Link href={`/admin/orders?status=all&q=${encodeURIComponent(chat.profile.email)}`} className="font-medium text-primary hover:underline">
                  View their orders
                </Link>
              </CardContent>
            )}
          </Card>

          {otherChats.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Their other chats</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {otherChats.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2">
                      <Link href={`/admin/chats/${c.id}`} className="font-medium text-primary hover:underline">{formatDate(c.createdAt)}</Link>
                      <ChatStatusBadge status={c.status} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {open && (
            <Card>
              <CardContent className="flex flex-col gap-2">
                {(chat.status === "BOT" || chat.status === "WAITING") && (
                  <form action={joinChatAction}>
                    <input type="hidden" name="chatId" value={chat.id} />
                    <SubmitButton size="lg" className="w-full">Take over this chat</SubmitButton>
                  </form>
                )}
                <form action={closeChatAction}>
                  <input type="hidden" name="chatId" value={chat.id} />
                  <ConfirmSubmitButton
                    variant="outline"
                    size="lg"
                    className="w-full"
                    title="Close this chat?"
                    description="The customer is told the chat has ended. If they write in it again, it reopens and comes back to this queue."
                    confirmLabel="Close chat"
                  >
                    Close chat
                  </ConfirmSubmitButton>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
