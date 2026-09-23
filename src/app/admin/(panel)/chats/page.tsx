import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { AutoRefresh } from "@/components/ui/auto-refresh";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ChatSeverityBadge, ChatStatusBadge } from "@/components/chat/chat-badges";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Chats" };

const DAY_MS = 24 * 60 * 60 * 1000;

type Section = { title: string; description: string; where: Prisma.ChatConversationWhereInput; orderBy: Prisma.ChatConversationOrderByWithRelationInput[] };

/** Built per request, since "the last 24 hours" moves. */
const sections = (): Section[] => [
  {
    title: "Needs a pharmacist",
    description: "Emergencies first, then longest waiting.",
    where: { status: "WAITING" },
    orderBy: [{ severity: { sort: "desc", nulls: "last" } }, { handedOverAt: "asc" }],
  },
  { title: "In progress", description: "Chats a pharmacist has joined.", where: { status: "WITH_PHARMACIST" }, orderBy: [{ updatedAt: "desc" }] },
  {
    title: "With the assistant",
    description: "Active in the last 24 hours. Join any of them to take over.",
    where: { status: "BOT", updatedAt: { gte: new Date(Date.now() - DAY_MS) } },
    orderBy: [{ updatedAt: "desc" }],
  },
  { title: "Recently closed", description: "The last 20.", where: { status: "CLOSED" }, orderBy: [{ closedAt: "desc" }] },
];

function findChats(section: Section) {
  return db.chatConversation.findMany({
    where: section.where,
    orderBy: section.orderBy,
    take: 20,
    include: {
      profile: { select: { fullName: true, email: true } },
      pharmacist: { select: { fullName: true, email: true } },
      messages: { where: { role: { not: "SYSTEM" } }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export default async function ChatsPage() {
  await requireStaff();
  const list = sections();
  const results = await Promise.all(list.map(findChats));

  return (
    <div className="max-w-4xl space-y-8">
      <AutoRefresh seconds={10} />
      <PageHeader size="sm" title="Chats" description="Customers are told a pharmacist will reply in the chat window on the site." className="mb-2" />
      {list.map((section, i) => (
        <section key={section.title}>
          <div className="mb-3">
            <h2 className="font-semibold">{section.title} <span className="text-muted-foreground">({results[i].length})</span></h2>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
          {results[i].length === 0 ? (
            <EmptyState bordered icon={MessagesSquare} title="None right now" className="bg-background py-8" />
          ) : (
            <Card className="py-0">
              <ul className="divide-y">
                {results[i].map((chat) => (
                  <li key={chat.id}>
                    <Link href={`/admin/chats/${chat.id}`} className="flex flex-col gap-1.5 p-4 hover:bg-accent sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="flex flex-wrap items-center gap-2 font-semibold">
                          {chat.profile ? (chat.profile.fullName ?? chat.profile.email) : "Guest"}
                          <ChatSeverityBadge severity={chat.severity} />
                          <ChatStatusBadge status={chat.status} />
                        </p>
                        {chat.handoverReason && <p className="text-sm">{chat.handoverReason}</p>}
                        {chat.messages[0] && <p className="truncate text-sm text-muted-foreground">“{chat.messages[0].content}”</p>}
                        {chat.pharmacist && <p className="text-xs text-muted-foreground">With {chat.pharmacist.fullName ?? chat.pharmacist.email}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(chat.handedOverAt ?? chat.updatedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      ))}
    </div>
  );
}
