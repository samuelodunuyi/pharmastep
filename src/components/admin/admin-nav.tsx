"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Mail, Package, ShoppingCart, Tags, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, adminOnly: false },
  { href: "/admin/prescriptions", label: "Prescriptions", icon: FileText, adminOnly: false },
  { href: "/admin/products", label: "Products", icon: Package, adminOnly: true },
  { href: "/admin/categories", label: "Categories", icon: Tags, adminOnly: true },
  { href: "/admin/staff", label: "Staff", icon: Users, adminOnly: true },
  { href: "/admin/messages", label: "Messages", icon: Mail, adminOnly: false },
];

export function AdminNav({ isAdmin, pendingPrescriptions }: { isAdmin: boolean; pendingPrescriptions: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
      {ITEMS.filter((i) => isAdmin || !i.adminOnly).map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
              active && "bg-secondary text-secondary-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
            {href === "/admin/prescriptions" && pendingPrescriptions > 0 && (
              <Badge className="ml-auto bg-brand text-brand-foreground">{pendingPrescriptions}</Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
