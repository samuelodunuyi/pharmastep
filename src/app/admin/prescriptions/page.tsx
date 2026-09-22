import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { RxBadge } from "@/components/product/product-badges";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Prescriptions" };

export default async function PrescriptionsQueue() {
  await requireStaff();
  const orders = await db.order.findMany({
    where: { status: "PAID", prescriptionStatus: "PENDING_REVIEW" },
    orderBy: { paidAt: "asc" },
    include: { items: { where: { requiresPrescription: true } } },
  });

  return (
    <div>
      <PageHeader
        size="sm"
        title="Prescriptions to review"
        description="Oldest first. Paid orders can’t be dispatched until their prescription is approved."
      />
      {orders.length === 0 ? (
        <EmptyState bordered icon={FileCheck2} title="All caught up" description="No prescriptions are waiting for review." className="bg-background" />
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-accent">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 font-semibold">{o.reference} · {o.customerName} <RxBadge /></p>
                    <p className="text-sm text-muted-foreground">{o.items.map((i) => `${i.quantity} × ${i.productName}`).join(", ")}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Paid {o.paidAt && formatDate(o.paidAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
