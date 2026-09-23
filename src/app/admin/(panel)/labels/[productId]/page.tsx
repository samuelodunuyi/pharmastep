import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LabelForm } from "@/components/admin/label-form";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Pack label" };

export default async function LabelPage(props: PageProps<"/admin/labels/[productId]">) {
  await requireStaff();
  const { productId } = await props.params;
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      manufacturer: true,
      activeIngredient: true,
      strength: true,
      packSize: true,
      label: { include: { reviewedBy: { select: { fullName: true, email: true } } } },
    },
  });
  if (!product) notFound();
  const label = product.label;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        size="sm"
        title={product.name}
        breadcrumbs={[{ label: "Pack labels", href: "/admin/labels" }, { label: product.name }]}
        description={[product.manufacturer, product.activeIngredient, product.strength, product.packSize].filter(Boolean).join(" · ")}
        actions={
          !label ? (
            <Badge variant="outline">No label</Badge>
          ) : label.status === "DRAFT" ? (
            <Badge variant="warning">Draft</Badge>
          ) : label.reviewedAt ? (
            <Badge variant="success">Checked</Badge>
          ) : (
            <Badge variant="warning">Live, not checked</Badge>
          )
        }
        className="mb-0"
      />

      {label?.status === "APPROVED" && label.reviewedAt && (
        <p className="text-sm text-muted-foreground">
          Approved by {label.reviewedBy?.fullName ?? label.reviewedBy?.email ?? "former staff"} on {formatDate(label.reviewedAt)}. Saving any change
          returns it to draft until it's approved again.
        </p>
      )}
      {label?.status === "APPROVED" && !label.reviewedAt && (
        <p className="text-sm text-muted-foreground">
          Live from the official leaflet, but no pharmacist has checked it against the pack we stock yet. Approve it once checked.
        </p>
      )}
      {label && !label.reviewedAt && label.notes && (
        <Alert variant="warning">
          <AlertTitle>Check before approving</AlertTitle>
          <AlertDescription>{label.notes}</AlertDescription>
        </Alert>
      )}
      {label?.sourceUrl && (
        <a href={label.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Open the source leaflet <ExternalLink className="size-3.5" />
        </a>
      )}

      <Card>
        <CardContent>
          <LabelForm productId={product.id} label={label} />
        </CardContent>
      </Card>

      <Link href={`/products/${product.slug}`} className="text-sm text-muted-foreground hover:underline">View the product page</Link>
    </div>
  );
}
