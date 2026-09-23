import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeliveryDetails } from "@/components/order/delivery-details";
import { OrderStatusBadge, PrescriptionStatusBadge } from "@/components/order/order-status-badge";
import { OrderLineItems, OrderTotals } from "@/components/order/order-summary";
import { OrderEvents, OrderProgress } from "@/components/order/order-timeline";
import { retryPaymentAction } from "@/app/actions/checkout";
import { getCurrentProfile, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNaira } from "@/lib/format";
import { orderItemsToLines } from "@/lib/order-lines";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : undefined;
  const payment = typeof sp.payment === "string" ? sp.payment : undefined;

  const [order, profile] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { slug: true } } } },
        events: { where: { internal: false }, orderBy: { createdAt: "desc" } },
        prescription: { select: { reviewNote: true } },
      },
    }),
    getCurrentProfile(),
  ]);

  const canView = order && (order.trackingToken === token || (profile && order.profileId === profile.id) || isStaff(profile));
  if (!order || !canView) notFound();

  const unpaid = order.status === "PENDING_PAYMENT";
  const inProgress = !unpaid && order.status !== "CANCELLED" && order.status !== "REFUNDED";

  return (
    <div className="container-page max-w-4xl space-y-6 py-8">
      {payment === "success" && !unpaid && (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertTitle>Thank you! Your payment was received.</AlertTitle>
          <AlertDescription>
            {order.prescriptionStatus === "PENDING_REVIEW"
              ? "A pharmacist will review your prescription shortly. We’ll contact you if we need anything."
              : "We’re preparing your order. Bookmark this page to track it."}
          </AlertDescription>
        </Alert>
      )}
      {unpaid && (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>{payment === "failed" ? "Your payment didn’t go through" : "This order hasn’t been paid yet"}</AlertTitle>
          <AlertDescription>
            <p>No money is taken for an unsuccessful payment.</p>
            <form action={retryPaymentAction} className="mt-3">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="token" value={order.trackingToken} />
              <SubmitButton variant="brand" size="lg">Pay {formatNaira(order.totalKobo)}</SubmitButton>
            </form>
          </AlertDescription>
        </Alert>
      )}

      <PageHeader
        eyebrow="Order"
        title={order.reference}
        description={`Placed ${formatDate(order.createdAt)}`}
        actions={<OrderStatusBadge status={order.status} legacyStatus={order.isLegacy ? order.legacyStatus : null} />}
        className="mb-0"
      />

      {inProgress && !order.isLegacy && (
        <Card><CardContent><OrderProgress status={order.status} /></CardContent></Card>
      )}

      {order.prescriptionStatus !== "NOT_REQUIRED" && (
        <Card>
          <CardContent className="flex gap-3">
            <FileText className="size-5 shrink-0 text-brand" />
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2 font-semibold">Prescription <PrescriptionStatusBadge status={order.prescriptionStatus} /></p>
              {order.prescription?.reviewNote && <p className="text-muted-foreground">{order.prescription.reviewNote}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader><CardTitle>Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <OrderLineItems lines={orderItemsToLines(order.items, true)} />
            <OrderTotals subtotalKobo={order.subtotalKobo} delivery={order.deliveryFeeKobo} totalKobo={order.totalKobo} />
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader><CardTitle>Delivering to</CardTitle></CardHeader>
          <CardContent><DeliveryDetails {...order} email={undefined} /></CardContent>
        </Card>
      </div>

      {order.events.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Updates</CardTitle></CardHeader>
          <CardContent><OrderEvents events={order.events} /></CardContent>
        </Card>
      )}
    </div>
  );
}
