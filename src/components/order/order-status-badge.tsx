import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, RX_STATUS_LABEL } from "@/lib/format";
import type { OrderStatus, PrescriptionStatus } from "@/generated/prisma/enums";

type Variant = React.ComponentProps<typeof Badge>["variant"];

const ORDER_VARIANT: Record<OrderStatus, Variant> = {
  PENDING_PAYMENT: "warning",
  PAID: "secondary",
  PROCESSING: "secondary",
  OUT_FOR_DELIVERY: "secondary",
  DELIVERED: "success",
  CANCELLED: "outline",
  REFUNDED: "outline",
};

const RX_VARIANT: Record<PrescriptionStatus, Variant> = {
  NOT_REQUIRED: "outline",
  PENDING_REVIEW: "brand",
  APPROVED: "success",
  REJECTED: "destructive",
};

export function OrderStatusBadge({ status, legacyStatus }: { status: OrderStatus; legacyStatus?: string | null }) {
  // Imported orders keep the free-text status from the old site.
  if (legacyStatus) return <Badge variant="outline">{legacyStatus} · old site</Badge>;
  return <Badge variant={ORDER_VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  if (status === "NOT_REQUIRED") return <span className="text-muted-foreground">—</span>;
  return <Badge variant={RX_VARIANT[status]}>{RX_STATUS_LABEL[status]}</Badge>;
}
