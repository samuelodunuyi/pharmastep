import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RxBadge({ className }: { className?: string }) {
  return (
    <Badge variant="brand" className={className} title="Prescription required">
      <FileText data-icon="inline-start" /> Rx
    </Badge>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  return stock > 0 ? <Badge variant="success">In stock</Badge> : <Badge variant="secondary">Out of stock</Badge>;
}

export function Price({ kobo, compareAt, size = "default", className }: { kobo: number; compareAt?: number | null; size?: "default" | "lg"; className?: string }) {
  const discounted = compareAt != null && compareAt > kobo;
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-bold text-primary", size === "lg" && "text-2xl")}>{formatNaira(kobo)}</span>
      {discounted && (
        <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-base" : "text-xs")}>
          {formatNaira(compareAt)}
        </span>
      )}
    </div>
  );
}
