import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { RxBadge } from "@/components/product/product-badges";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Pack labels" };

const ORDER = { DRAFT: 0, UNCHECKED: 1, MISSING: 2, APPROVED: 3 } as const;

export default async function LabelsPage() {
  await requireStaff();
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      requiresPrescription: true,
      label: { select: { status: true, reviewedAt: true, reviewedBy: { select: { fullName: true, email: true } } } },
    },
  });
  const rows = products
    .map((p) => ({
      ...p,
      state: !p.label ? ("MISSING" as const) : p.label.status === "APPROVED" && !p.label.reviewedAt ? ("UNCHECKED" as const) : p.label.status,
    }))
    .sort((a, b) => ORDER[a.state] - ORDER[b.state]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        size="sm"
        title="Pack labels"
        description="Directions and warnings from each product's pack. Approved labels are shown to customers and used by the chat assistant. Labels published straight from the official leaflet are live but not yet checked against the pack we stock: open each one and approve it once checked."
      />
      <Card className="py-0">
        <ul className="divide-y">
          {rows.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/labels/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-accent">
                <span className="flex items-center gap-2 font-medium">
                  {p.name} {p.requiresPrescription && <RxBadge />}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {p.state === "APPROVED" && p.label?.reviewedAt && (
                    <>by {p.label.reviewedBy?.fullName ?? p.label.reviewedBy?.email ?? "former staff"}, {formatDate(p.label.reviewedAt)}</>
                  )}
                  {p.state === "APPROVED" && <Badge variant="success">Checked</Badge>}
                  {p.state === "UNCHECKED" && <Badge variant="warning">Live, not checked</Badge>}
                  {p.state === "DRAFT" && <Badge variant="warning">Draft to review</Badge>}
                  {p.state === "MISSING" && <Badge variant="outline">No label</Badge>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
