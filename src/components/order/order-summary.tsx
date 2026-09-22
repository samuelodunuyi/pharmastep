import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { RxBadge } from "@/components/product/product-badges";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

export type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  unitPriceKobo: number;
  requiresPrescription: boolean;
  /** Link the name to the product page when set. */
  href?: string;
};

/** Read-only list of items. Used by checkout, the customer order page and the admin order page. */
export function OrderLineItems({ lines, showUnitPrice, className }: { lines: OrderLine[]; showUnitPrice?: boolean; className?: string }) {
  return (
    <ul className={cn("divide-y text-sm", className)}>
      {lines.map((l) => (
        <li key={l.id} className="flex items-center justify-between gap-4 py-2.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate">
              {l.quantity} × {l.href ? <Link href={l.href} className="hover:underline">{l.name}</Link> : l.name}
            </span>
            {l.requiresPrescription && <RxBadge />}
          </span>
          <span className="shrink-0 text-right">
            {showUnitPrice && <span className="mr-3 text-muted-foreground">{formatNaira(l.unitPriceKobo)} each</span>}
            <span className="font-medium">{formatNaira(l.unitPriceKobo * l.quantity)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

type TotalsProps = {
  subtotalKobo: number;
  /** A kobo amount, or custom content such as "Calculated at checkout". */
  delivery: number | React.ReactNode;
  deliveryNote?: React.ReactNode;
  totalKobo?: number;
  totalLabel?: string;
  subtotalLabel?: string;
  className?: string;
};

/** Subtotal / delivery / total rows. Used by the cart, checkout and both order pages. */
export function OrderTotals({
  subtotalKobo,
  delivery,
  deliveryNote,
  totalKobo,
  totalLabel = "Total",
  subtotalLabel = "Subtotal",
  className,
}: TotalsProps) {
  const total = totalKobo ?? subtotalKobo + (typeof delivery === "number" ? delivery : 0);
  return (
    <div className={cn("text-sm", className)}>
      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{subtotalLabel}</dt>
          <dd className="font-medium">{formatNaira(subtotalKobo)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Delivery {deliveryNote}</dt>
          <dd className="font-medium">{typeof delivery === "number" ? formatNaira(delivery) : delivery}</dd>
        </div>
      </dl>
      <Separator className="my-3" />
      <div className="flex justify-between text-base font-bold text-primary">
        <span>{totalLabel}</span>
        <span>{formatNaira(total)}</span>
      </div>
    </div>
  );
}
