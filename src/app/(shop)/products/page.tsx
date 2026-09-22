import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ProductListing, normalizeParams } from "@/components/product/product-listing";

export const metadata: Metadata = { title: "All products" };

export default async function ProductsPage(props: PageProps<"/products">) {
  const params = normalizeParams(await props.searchParams);
  return (
    <div className="container-page py-8">
      <PageHeader title={params.q ? "Search results" : "All products"} />
      <ProductListing params={params} basePath="/products" />
    </div>
  );
}
