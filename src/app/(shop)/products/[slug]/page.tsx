import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, ShieldCheck, Truck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { ProductGrid, productCardSelect } from "@/components/product/product-card";
import { Price, RxBadge, StockBadge } from "@/components/product/product-badges";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { db } from "@/lib/db";

async function getProduct(slug: string) {
  return db.product.findFirst({ where: { slug, isActive: true }, include: { category: true, label: true } });
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProduct((await props.params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? `Buy ${product.name} online from PharmaStep.`,
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const product = await getProduct((await props.params).slug);
  if (!product) notFound();

  // Only an approved label is ever shown to customers.
  const label = product.label?.status === "APPROVED" ? product.label : null;
  const related = product.categoryId
    ? await db.product.findMany({
        where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
        take: 5,
        orderBy: { stock: "desc" },
        select: productCardSelect,
      })
    : [];

  const details = [
    ["Active ingredient", product.activeIngredient],
    ["Strength", product.strength],
    ["Form", product.dosageForm],
    ["Pack size", product.packSize],
    ["Manufacturer", product.manufacturer],
    ["NAFDAC No.", product.nafdacNumber],
  ].filter(([, v]) => v) as [string, string][];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description ?? undefined,
    brand: product.manufacturer ? { "@type": "Brand", name: product.manufacturer } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: (product.priceKobo / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />

        <div>
          <PageHeader
            className="mb-3"
            title={product.name}
            eyebrow={product.manufacturer && <span className="font-medium tracking-wide uppercase">{product.manufacturer}</span>}
            breadcrumbs={[
              { label: "Products", href: "/products" },
              ...(product.category ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }] : []),
            ]}
          />
          <div className="flex flex-wrap gap-2">
            {product.requiresPrescription && <RxBadge />}
            <StockBadge stock={product.stock} />
          </div>
          <Price kobo={product.priceKobo} compareAt={product.compareAtPriceKobo} size="lg" className="mt-5" />

          {product.requiresPrescription && (
            <Alert variant="brand" className="mt-5">
              <FileText />
              <AlertTitle>Prescription required</AlertTitle>
              <AlertDescription>
                You’ll upload a photo of your prescription at checkout. A pharmacist reviews it before we dispatch; if it can’t be
                approved, you’re refunded in full.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6">
            <ProductPurchase productId={product.id} productName={product.name} stock={product.stock} />
          </div>

          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Truck className="size-4 text-primary" /> Delivery across Lagos. Fee shown at checkout.</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Genuine product from licensed suppliers.</li>
          </ul>

          {details.length > 0 && (
            <Card className="mt-8 py-0">
              <dl className="divide-y text-sm">
                {details.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_1fr] gap-4 px-4 py-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {product.description && (
            <div className="mt-8">
              <h2 className="font-semibold">About this product</h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{product.description}</p>
            </div>
          )}

          {label && (
            <div className="mt-8 space-y-3 text-sm">
              <h2 className="font-semibold">Directions and warnings</h2>
              <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{label.directions}</p>
              {label.warnings && <p className="leading-relaxed whitespace-pre-line text-muted-foreground">{label.warnings}</p>}
              <p className="text-xs text-muted-foreground">
                {label.reviewedAt ? "From the pack label, checked by a PharmaStep pharmacist." : "From the official product leaflet."}
              </p>
            </div>
          )}

          <p className="mt-8 text-xs text-muted-foreground">
            Always read the label and follow your doctor’s or pharmacist’s advice. If symptoms persist, consult a healthcare professional.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="You may also need" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
