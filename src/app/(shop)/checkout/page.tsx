import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderLineItems } from "@/components/order/order-summary";
import { getCurrentProfile } from "@/lib/auth";
import { getCart, summarizeCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { cartItemsToLines } from "@/lib/order-lines";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [cart, profile] = await Promise.all([getCart(), getCurrentProfile()]);
  const { items, subtotalKobo, needsPrescription } = summarizeCart(cart);
  if (items.length === 0) redirect("/cart");
  const lines = cartItemsToLines(items);

  return (
    <div className="container-page py-8">
      <PageHeader title="Checkout" />

      <Card className="mb-6 lg:hidden">
        <CardContent>
          <details>
            <summary className="cursor-pointer text-sm font-semibold">Show {items.length} items · {formatNaira(subtotalKobo)}</summary>
            <OrderLineItems lines={lines} className="mt-2" />
          </details>
        </CardContent>
      </Card>

      <CheckoutForm
        defaults={{ email: profile?.email ?? "", fullName: profile?.fullName ?? "", phone: profile?.phone ?? "" }}
        subtotalKobo={subtotalKobo}
        needsPrescription={needsPrescription}
        signedIn={!!profile}
      />

      <Card className="mt-8 hidden lg:flex lg:max-w-[calc(100%-412px)]">
        <CardHeader><CardTitle>Items in your order</CardTitle></CardHeader>
        <CardContent><OrderLineItems lines={lines} /></CardContent>
      </Card>
    </div>
  );
}
