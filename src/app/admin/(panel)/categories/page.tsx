import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { CategoryPlaceholder } from "@/components/product/category-placeholder";
import { deleteCategoryAction } from "@/app/actions/admin";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requireStaff(true);
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader size="sm" title="Categories" className="mb-0" />

      <Card>
        <CardHeader><CardTitle>Add category</CardTitle></CardHeader>
        <CardContent><CategoryForm /></CardContent>
      </Card>

      {categories.map((c) => (
        <Card key={c.id}>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {c.imageUrl ? <Image src={c.imageUrl} alt="" fill sizes="64px" className="object-cover" /> : <CategoryPlaceholder />}
            </div>
            <div className="flex-1 space-y-2">
              <CategoryForm category={c} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>/{c.slug} · {c._count.products} products</span>
                {c._count.products === 0 && (
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" variant="link" size="xs" className="text-destructive">Delete empty category</Button>
                  </form>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
