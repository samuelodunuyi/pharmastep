import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShoppingBag } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CartLine } from "@/components/cart/cart-line";
import { OrderTotals } from "@/components/order/order-summary";
import { getCart, summarizeCart } from "@/lib/cart";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const { items, subtotalKobo, count, needsPrescription } = summarizeCart(await getCart());

  if (items.length === 0) {
    return (
      <div className="container-page py-24">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Search for a medicine or browse by category to get started."
          action={<Button asChild size="xl"><Link href="/categories">Browse categories</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <PageHeader title="Your cart" />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="py-0">
          <ul className="divide-y px-4 sm:px-6">
            {items.map((item) => (
              <CartLine
                key={item.id}
                line={{
                  productId: item.productId,
                  slug: item.product.slug,
                  name: item.product.name,
                  manufacturer: item.product.manufacturer,
                  image: item.product.images[0],
                  priceKobo: item.product.priceKobo,
                  quantity: item.quantity,
                  stock: item.product.stock,
                  requiresPrescription: item.product.requiresPrescription,
                }}
              />
            ))}
          </ul>
        </Card>

        <Card className="h-fit lg:sticky lg:top-28">
          <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <OrderTotals
              subtotalKobo={subtotalKobo}
              subtotalLabel={`Items (${count})`}
              delivery={<span className="font-normal text-muted-foreground">Calculated at checkout</span>}
              totalLabel="Subtotal"
            />
            {needsPrescription && (
              <Alert variant="brand">
                <FileText />
                <AlertDescription>Your cart has prescription items. You’ll upload your prescription at checkout.</AlertDescription>
              </Alert>
            )}
            <Button asChild variant="brand" size="xl" className="w-full"><Link href="/checkout">Proceed to checkout</Link></Button>
            <Button asChild variant="ghost" size="lg" className="w-full"><Link href="/products">Continue shopping</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
