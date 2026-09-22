import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryGrid } from "@/components/product/category-tile";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <div className="container-page py-8">
      <PageHeader title="Categories" description="Find medicines and health products by what they treat." />
      <CategoryGrid categories={categories} />
    </div>
  );
}
