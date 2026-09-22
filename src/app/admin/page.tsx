import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { OrdersTable } from "@/components/admin/orders-table";
import { StatCard } from "@/components/admin/stat-card";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";

export default async function AdminDashboard() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [toReview, toFulfil, lowStock, revenue, recent] = await Promise.all([
    db.order.count({ where: { status: "PAID", prescriptionStatus: "PENDING_REVIEW" } }),
    db.order.count({
      where: { status: { in: ["PAID", "PROCESSING", "OUT_FOR_DELIVERY"] }, prescriptionStatus: { in: ["NOT_REQUIRED", "APPROVED"] }, isLegacy: false },
    }),
    db.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
    db.order.aggregate({ where: { paidAt: { gte: since }, status: { notIn: ["REFUNDED", "CANCELLED"] } }, _sum: { totalKobo: true }, _count: true }),
    db.order.findMany({ where: { paidAt: { not: null } }, orderBy: { paidAt: "desc" }, take: 8 }),
  ]);

  return (
    <div>
      <PageHeader title="Dashboard" size="sm" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Prescriptions to review" value={toReview} href="/admin/prescriptions" highlight={toReview > 0} />
        <StatCard label="Orders to fulfil" value={toFulfil} href="/admin/orders?status=open" />
        <StatCard label="Low stock (5 or fewer)" value={lowStock} href="/admin/products?stock=low" />
        <StatCard label="Revenue, last 30 days" value={formatNaira(revenue._sum.totalKobo ?? 0)} sub={`${revenue._count} paid orders`} />
      </div>

      <SectionHeader title="Recent paid orders" href="/admin/orders?status=all" linkLabel="All orders" className="mt-10 mb-4" />
      <OrdersTable orders={recent} dateField="paidAt" showPrescription={false} />
    </div>
  );
}
