import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { markMessageHandledAction } from "@/app/actions/admin";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireStaff();
  const messages = await db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 100 });

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader size="sm" title="Contact messages" className="mb-2" />
      {messages.length === 0 && <EmptyState bordered icon={Mail} title="No messages yet" className="bg-background" />}
      {messages.map((m) => (
        <Card key={m.id} className={cn(m.handled && "opacity-60")}>
          <CardHeader>
            <CardTitle>{m.subject}</CardTitle>
            <CardDescription>
              {m.name} · <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="text-primary hover:underline">{m.email}</a> · {formatDate(m.createdAt)}
            </CardDescription>
            {!m.handled && (
              <CardAction>
                <form action={markMessageHandledAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton variant="outline" size="sm">Mark handled</SubmitButton>
                </form>
              </CardAction>
            )}
          </CardHeader>
          <CardContent><p className="text-sm whitespace-pre-line">{m.message}</p></CardContent>
        </Card>
      ))}
    </div>
  );
}
