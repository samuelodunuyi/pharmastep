import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shown for a category that has no photo yet (e.g. just created in admin). Fills its parent. */
export function CategoryPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 grid place-items-center bg-secondary text-muted-foreground/50", className)} aria-hidden>
      <Pill className="size-1/4" strokeWidth={1.5} />
    </div>
  );
}
