"use client";

import { useState } from "react";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { AddToCartButton } from "@/components/product/add-to-cart-button";

const MAX_PER_ORDER = 20;

/** Quantity picker + add to cart, on the product page. */
export function ProductPurchase({ productId, productName, stock }: { productId: string; productName: string; stock: number }) {
  const max = Math.max(0, Math.min(stock, MAX_PER_ORDER));
  const [qty, setQty] = useState(max > 0 ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper value={qty} onChange={setQty} max={max} disabled={max === 0} size="lg" />
      <AddToCartButton
        productId={productId}
        productName={productName}
        quantity={qty}
        disabled={max === 0}
        size="xl"
        className="min-w-48 flex-1"
      />
    </div>
  );
}
