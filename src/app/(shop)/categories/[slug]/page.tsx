import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ProductListing, normalizeParams } from "@/components/product/product-listing";
import { db } from "@/lib/db";

export async function generateMetadata(props: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await db.category.findUnique({ where: { slug }, select: { name: true } });
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage(props: PageProps<"/categories/[slug]">) {
  const { slug } = await props.params;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const params = { ...normalizeParams(await props.searchParams), category: slug };

  return (
    <div className="container-page py-8">
      <PageHeader title={category.name} breadcrumbs={[{ label: "Categories", href: "/categories" }, { label: category.name }]} />
      <ProductListing params={params} basePath={`/categories/${slug}`} />
    </div>
  );
}
