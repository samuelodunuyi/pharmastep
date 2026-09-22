"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { RxBadge } from "@/components/product/product-badges";
import { ProductImage } from "@/components/product/product-image";
import { setQuantityAction } from "@/app/actions/cart";
import { formatNaira } from "@/lib/format";

export type CartLineData = {
  productId: string;
  slug: string;
  name: string;
  manufacturer: string | null;
  image?: string;
  priceKobo: number;
  quantity: number;
  stock: number;
  requiresPrescription: boolean;
};

export function CartLine({ line }: { line: CartLineData }) {
  const [pending, startTransition] = useTransition();
  const [qty, setOptimisticQty] = useOptimistic(line.quantity);
  const href = `/products/${line.slug}`;

  function update(next: number) {
    startTransition(async () => {
      setOptimisticQty(next);
      await setQuantityAction(line.productId, next);
    });
  }

  return (
    <li className="flex gap-4 py-5">
      <Link href={href} className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-background sm:size-24">
        <ProductImage src={line.image} alt={line.name} sizes="96px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <Link href={href} className="font-semibold hover:text-primary">{line.name}</Link>
          {line.manufacturer && <p className="text-xs text-muted-foreground">{line.manufacturer}</p>}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{formatNaira(line.priceKobo)} each</span>
            {line.requiresPrescription && <RxBadge />}
          </div>
          {line.quantity > line.stock && (
            <p className="mt-1 text-xs font-medium text-warning">Only {line.stock} left. Please reduce the quantity.</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <QuantityStepper value={qty} onChange={update} max={Math.min(line.stock, 20)} pending={pending} />
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{formatNaira(line.priceKobo * qty)}</span>
            <Button variant="ghost" size="icon-sm" onClick={() => update(0)} disabled={pending} aria-label={`Remove ${line.name}`}>
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
