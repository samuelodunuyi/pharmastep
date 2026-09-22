"use client";

import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type FilterGroupData = { title: string; options: { label: string; href: string; active: boolean }[] };

function FilterGroups({ groups, closeOnSelect }: { groups: FilterGroupData[]; closeOnSelect?: boolean }) {
  return (
    <div className="space-y-6 text-sm">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 font-semibold">{group.title}</p>
          <ul className="space-y-0.5">
            {group.options.map((o) => {
              const link = (
                <Link
                  href={o.href}
                  aria-current={o.active || undefined}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground",
                    o.active && "bg-secondary font-semibold text-secondary-foreground",
                  )}
                >
                  {o.label}
                </Link>
              );
              return <li key={o.label}>{closeOnSelect ? <SheetClose asChild>{link}</SheetClose> : link}</li>;
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * "sidebar": the filter list, shown on desktop only.
 * "sheet": a Filters button that opens the same list in a side panel, shown below desktop width.
 */
export function ProductFilters({ groups, variant }: { groups: FilterGroupData[]; variant: "sidebar" | "sheet" }) {
  if (variant === "sidebar") {
    return (
      <aside className="hidden lg:block">
        <FilterGroups groups={groups} />
      </aside>
    );
  }
  // Count filters other than each group's "all" default (always the first option).
  const activeCount = groups.filter((g) => !g.options[0]?.active).length;
  return (
    <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="lg" className="lg:hidden">
            <SlidersHorizontal /> Filters
            {activeCount > 0 && <Badge className="ml-1">{activeCount}</Badge>}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
          <div className="px-4 pb-6">
            <FilterGroups groups={groups} closeOnSelect />
          </div>
        </SheetContent>
      </Sheet>
  );
}
