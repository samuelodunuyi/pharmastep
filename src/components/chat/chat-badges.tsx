import { Badge } from "@/components/ui/badge";
import { CHAT_SEVERITY_LABEL, CHAT_STATUS_LABEL } from "@/lib/format";
import type { ChatSeverity, ChatStatus } from "@/generated/prisma/enums";

type Variant = React.ComponentProps<typeof Badge>["variant"];

const STATUS_VARIANT: Record<ChatStatus, Variant> = {
  BOT: "outline",
  WAITING: "warning",
  WITH_PHARMACIST: "success",
  CLOSED: "secondary",
};

const SEVERITY_VARIANT: Record<ChatSeverity, Variant> = {
  MODERATE: "secondary",
  SEVERE: "warning",
  EMERGENCY: "destructive",
};

export function ChatStatusBadge({ status }: { status: ChatStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{CHAT_STATUS_LABEL[status]}</Badge>;
}

export function ChatSeverityBadge({ severity }: { severity: ChatSeverity | null }) {
  if (!severity) return null;
  return <Badge variant={SEVERITY_VARIANT[severity]}>{CHAT_SEVERITY_LABEL[severity]}</Badge>;
}
