import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FieldGroup } from "@/components/ui/field";
import { TextareaField, TextField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeliveryDetails } from "@/components/order/delivery-details";
import { OrderStatusBadge, PrescriptionStatusBadge } from "@/components/order/order-status-badge";
import { OrderLineItems, OrderTotals } from "@/components/order/order-summary";
import { OrderEvents } from "@/components/order/order-timeline";
import {
  addOrderNoteAction,
  cancelOrderAction,
  reviewPrescriptionAction,
  updateOrderStatusAction,
} from "@/app/actions/admin";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { orderItemsToLines } from "@/lib/order-lines";
import { prescriptionSignedUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Order" };

const NEXT_STEP: Record<string, { status: string; label: string }> = {
  PAID: { status: "PROCESSING", label: "Start preparing" },
  PROCESSING: { status: "OUT_FOR_DELIVERY", label: "Mark out for delivery" },
  OUT_FOR_DELIVERY: { status: "DELIVERED", label: "Mark delivered" },
};

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  const staff = await requireStaff();
  const { id } = await props.params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { slug: true } } } },
      events: { orderBy: { createdAt: "desc" }, include: { actor: { select: { fullName: true, email: true } } } },
      prescription: { include: { reviewer: { select: { fullName: true, email: true } } } },
      profile: { select: { email: true } },
    },
  });
  if (!order) notFound();

  const rxUrl = order.prescription ? await prescriptionSignedUrl(order.prescription.filePath) : null;
  const rxIsPdf = order.prescription?.filePath.toLowerCase().endsWith(".pdf");
  const rxBlocking = order.prescriptionStatus === "PENDING_REVIEW" || order.prescriptionStatus === "REJECTED";
  const next = NEXT_STEP[order.status];
  const closed = ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status);

  return (
    <div className="max-w-5xl">
      <PageHeader
        size="sm"
        title={order.reference}
        breadcrumbs={[{ label: "Orders", href: "/admin/orders" }, { label: order.reference }]}
        description={
          <>
            Placed {formatDate(order.createdAt)}
            {order.paidAt && <> · Paid {formatDate(order.paidAt)}</>}
            {order.paystackRef && <> · Paystack ref {order.paystackRef}</>}
          </>
        }
        actions={<OrderStatusBadge status={order.status} legacyStatus={order.isLegacy ? order.legacyStatus : null} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {order.prescription && (
            <Card className="ring-brand/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Prescription <PrescriptionStatusBadge status={order.prescriptionStatus} /></CardTitle>
                {order.prescription.reviewedAt && (
                  <CardDescription>
                    Reviewed by {order.prescription.reviewer?.fullName ?? order.prescription.reviewer?.email} on {formatDate(order.prescription.reviewedAt)}
                    {order.prescription.reviewNote && <>: “{order.prescription.reviewNote}”</>}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {!rxUrl ? (
                  <p className="text-sm text-destructive">Couldn’t load the file.</p>
                ) : rxIsPdf ? (
                  <Button asChild variant="outline" size="lg">
                    <a href={rxUrl} target="_blank" rel="noreferrer">Open PDF <ExternalLink /></a>
                  </Button>
                ) : (
                  // Signed URL that expires after 10 minutes, so it isn't passed through the image optimiser.
                  <a href={rxUrl} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rxUrl} alt="Uploaded prescription" className="max-h-[520px] rounded-lg border" />
                  </a>
                )}

                {order.prescriptionStatus === "PENDING_REVIEW" && order.status === "PAID" && (
                  <ActionForm action={reviewPrescriptionAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <FieldGroup>
                      <TextareaField
                        name="note"
                        label="Note to customer"
                        rows={2}
                        description="Required when rejecting. Check the patient name, prescriber details, date, and that items and quantities match."
                      />
                      <div className="flex flex-wrap gap-2">
                        <SubmitButton name="decision" value="approve" size="lg">Approve prescription</SubmitButton>
                        <ConfirmSubmitButton
                          name="decision"
                          value="reject"
                          variant="destructive"
                          size="lg"
                          title="Reject and refund?"
                          description="The customer will be told the prescription couldn’t be approved and refunded in full through Paystack."
                          confirmLabel="Reject & refund"
                        >
                          Reject &amp; refund
                        </ConfirmSubmitButton>
                      </div>
                    </FieldGroup>
                  </ActionForm>
                )}
                {order.prescriptionStatus === "PENDING_REVIEW" && order.status === "PENDING_PAYMENT" && (
                  <p className="text-sm text-muted-foreground">Review becomes available once the customer has paid.</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <OrderLineItems lines={orderItemsToLines(order.items, true)} showUnitPrice />
              <OrderTotals
                subtotalKobo={order.subtotalKobo}
                delivery={order.deliveryFeeKobo}
                deliveryNote={order.deliveryDistanceKm != null && <span className="text-xs">({order.deliveryDistanceKm} km)</span>}
                totalKobo={order.totalKobo}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <ActionForm action={addOrderNoteAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <div className="flex items-end gap-2">
                  <TextField name="note" label="Post an update" placeholder="The customer sees this on their order page" fieldClassName="flex-1" />
                  <SubmitButton variant="outline" size="lg" className="h-10">Post</SubmitButton>
                </div>
              </ActionForm>
              <OrderEvents events={order.events.map((e) => ({ ...e, actorName: e.actor?.fullName ?? e.actor?.email }))} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>{order.profile ? "Registered customer" : "Guest checkout"}</CardDescription>
            </CardHeader>
            <CardContent><DeliveryDetails {...order} contactLinks /></CardContent>
          </Card>

          {next && !order.isLegacy && (
            <Card>
              <CardHeader><CardTitle>Fulfilment</CardTitle></CardHeader>
              <CardContent>
                {rxBlocking ? (
                  <p className="text-sm text-muted-foreground">Waiting for prescription approval.</p>
                ) : (
                  <ActionForm action={updateOrderStatusAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value={next.status} />
                    <FieldGroup>
                      <TextField name="note" label="Note to customer (optional)" />
                      <SubmitButton size="xl" className="w-full">{next.label}</SubmitButton>
                    </FieldGroup>
                  </ActionForm>
                )}
              </CardContent>
            </Card>
          )}

          {staff.role === "ADMIN" && !closed && !order.isLegacy && (
            <Card>
              <CardHeader><CardTitle>Cancel order</CardTitle></CardHeader>
              <CardContent>
                <ActionForm action={cancelOrderAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <FieldGroup>
                    <TextField name="reason" label="Reason (shown to customer)" required />
                    <ConfirmSubmitButton
                      variant="destructive"
                      size="xl"
                      className="w-full"
                      title={order.paidAt ? "Cancel and refund this order?" : "Cancel this order?"}
                      description={order.paidAt ? "The customer is refunded in full through Paystack. This can’t be undone." : "This can’t be undone."}
                      confirmLabel={order.paidAt ? "Cancel & refund" : "Cancel order"}
                    >
                      {order.paidAt ? "Cancel & refund" : "Cancel order"}
                    </ConfirmSubmitButton>
                  </FieldGroup>
                </ActionForm>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
