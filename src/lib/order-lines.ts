import type { OrderLine } from "@/components/order/order-summary";

type OrderItemRow = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceKobo: number;
  requiresPrescription: boolean;
  product?: { slug: string } | null;
};

type CartItemRow = {
  id: string;
  quantity: number;
  product: { slug: string; name: string; priceKobo: number; requiresPrescription: boolean };
};

export function orderItemsToLines(items: OrderItemRow[], linkProducts = false): OrderLine[] {
  return items.map((i) => ({
    id: i.id,
    name: i.productName,
    quantity: i.quantity,
    unitPriceKobo: i.unitPriceKobo,
    requiresPrescription: i.requiresPrescription,
    href: linkProducts && i.product ? `/products/${i.product.slug}` : undefined,
  }));
}

export function cartItemsToLines(items: CartItemRow[]): OrderLine[] {
  return items.map((i) => ({
    id: i.id,
    name: i.product.name,
    quantity: i.quantity,
    unitPriceKobo: i.product.priceKobo,
    requiresPrescription: i.product.requiresPrescription,
  }));
}
