import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  href,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  href?: string;
  highlight?: boolean;
}) {
  const card = (
    <Card className={cn("h-full", href && "transition-shadow hover:shadow-md")}>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-bold", highlight ? "text-brand" : "text-primary")}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}
