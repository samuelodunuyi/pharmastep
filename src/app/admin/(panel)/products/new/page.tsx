import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireStaff(true);
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div className="max-w-5xl">
      <PageHeader size="sm" title="New product" breadcrumbs={[{ label: "Products", href: "/admin/products" }, { label: "New" }]} />
      <ProductForm
        categories={categories}
        values={{
          name: "", manufacturer: "", description: "", activeIngredient: "", strength: "", packSize: "",
          dosageForm: "", nafdacNumber: "", price: "", compareAtPrice: "", stock: "0", categoryId: "",
          tags: "", expiryDate: "", requiresPrescription: false, isActive: true, images: [],
        }}
      />
    </div>
  );
}
