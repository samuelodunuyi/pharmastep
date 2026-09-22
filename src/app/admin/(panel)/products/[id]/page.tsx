import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  await requireStaff(true);
  const { id } = await props.params;
  const saved = (await props.searchParams).saved === "1";
  const [p, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!p) notFound();

  return (
    <div className="max-w-5xl">
      <PageHeader
        size="sm"
        title={p.name}
        breadcrumbs={[{ label: "Products", href: "/admin/products" }, { label: "Edit" }]}
        actions={
          p.isActive && (
            <Button asChild variant="outline" size="lg">
              <Link href={`/products/${p.slug}`} target="_blank">View in store <ExternalLink /></Link>
            </Button>
          )
        }
      />
      {saved && <FormMessage state={{ message: "Saved." }} className="mb-4" />}
      <ProductForm
        key={p.updatedAt.toISOString()}
        categories={categories}
        values={{
          id: p.id,
          name: p.name,
          manufacturer: p.manufacturer ?? "",
          description: p.description ?? "",
          activeIngredient: p.activeIngredient ?? "",
          strength: p.strength ?? "",
          packSize: p.packSize ?? "",
          dosageForm: p.dosageForm ?? "",
          nafdacNumber: p.nafdacNumber ?? "",
          price: (p.priceKobo / 100).toString(),
          compareAtPrice: p.compareAtPriceKobo ? (p.compareAtPriceKobo / 100).toString() : "",
          stock: String(p.stock),
          categoryId: p.categoryId ?? "",
          tags: p.tags.join(", "),
          expiryDate: p.expiryDate ? p.expiryDate.toISOString().slice(0, 10) : "",
          requiresPrescription: p.requiresPrescription,
          isActive: p.isActive,
          images: p.images,
        }}
      />
    </div>
  );
}
