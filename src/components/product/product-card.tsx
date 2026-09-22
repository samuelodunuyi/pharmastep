import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Price, RxBadge } from "@/components/product/product-badges";
import { ProductImage } from "@/components/product/product-image";

/** Prisma `select` for everything a product card needs. */
export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  manufacturer: true,
  images: true,
  priceKobo: true,
  compareAtPriceKobo: true,
  stock: true,
  requiresPrescription: true,
  dosageForm: true,
  packSize: true,
} as const;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  manufacturer: string | null;
  images: string[];
  priceKobo: number;
  compareAtPriceKobo: number | null;
  stock: number;
  requiresPrescription: boolean;
  dosageForm: string | null;
  packSize: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const outOfStock = product.stock <= 0;
  const href = `/products/${product.slug}`;
  return (
    <Card className="gap-0 py-0 transition-shadow hover:shadow-md">
      <Link href={href} className="relative block aspect-square bg-background">
        <ProductImage src={product.images[0]} alt={product.name} sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" />
        <div className="absolute top-2 left-2 flex gap-1">
          {product.requiresPrescription && <RxBadge />}
          {outOfStock && <Badge variant="secondary">Out of stock</Badge>}
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-1.5 border-t p-3">
        {product.manufacturer && (
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">{product.manufacturer}</p>
        )}
        <Link href={href} className="line-clamp-2 font-semibold hover:text-primary">{product.name}</Link>
        {(product.dosageForm || product.packSize) && (
          <p className="text-xs text-muted-foreground">{[product.dosageForm, product.packSize].filter(Boolean).join(" · ")}</p>
        )}
        <Price kobo={product.priceKobo} compareAt={product.compareAtPriceKobo} className="mt-auto pt-1" />
        <AddToCartButton productId={product.id} productName={product.name} disabled={outOfStock} className="mt-1" />
      </CardContent>
    </Card>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
