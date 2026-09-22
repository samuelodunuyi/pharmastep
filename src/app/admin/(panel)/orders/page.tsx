import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/admin/search-input";
import { OrdersTable } from "@/components/admin/orders-table";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Orders" };

const FILTERS: Record<string, { label: string; where: Prisma.OrderWhereInput }> = {
  open: { label: "To fulfil", where: { status: { in: ["PAID", "PROCESSING", "OUT_FOR_DELIVERY"] }, isLegacy: false } },
  delivered: { label: "Delivered", where: { status: "DELIVERED" } },
  unpaid: { label: "Unpaid", where: { status: "PENDING_PAYMENT" } },
  closed: { label: "Cancelled / refunded", where: { status: { in: ["CANCELLED", "REFUNDED"] } } },
  all: { label: "All", where: {} },
};

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  await requireStaff();
  const sp = await props.searchParams;
  const key = typeof sp.status === "string" && FILTERS[sp.status] ? sp.status : "open";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const orders = await db.order.findMany({
    where: {
      ...FILTERS[key].where,
      ...(q && {
        OR: [
          { reference: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { customerName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title="Orders" size="sm" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {Object.entries(FILTERS).map(([k, f]) => (
          <Button key={k} asChild variant={k === key ? "default" : "outline"} size="lg">
            <Link href={`/admin/orders?status=${k}`}>{f.label}</Link>
          </Button>
        ))}
        <SearchInput className="ml-auto" placeholder="Order no., email, name, phone" defaultValue={q} hidden={{ status: key }} />
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
}
