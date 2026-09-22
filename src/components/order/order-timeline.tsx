import { Check } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "PAID", label: "Paid" },
  { key: "PROCESSING", label: "Being prepared" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

/** Four-step progress bar for paid orders. Renders nothing for other statuses. */
export function OrderProgress({ status }: { status: string }) {
  const current = STEPS.findIndex((s) => s.key === status);
  if (current < 0) return null;
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.key} className="flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full text-sm font-bold",
                done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("text-xs", done ? "font-semibold text-primary" : "text-muted-foreground")}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderEvents({ events }: { events: { id: string; note: string; createdAt: Date; actorName?: string | null }[] }) {
  return (
    <ol className="relative space-y-4 border-l pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary ring-4 ring-background" />
          <p className="text-sm">{e.note}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(e.createdAt)}
            {e.actorName && ` · ${e.actorName}`}
          </p>
        </li>
      ))}
    </ol>
  );
}
