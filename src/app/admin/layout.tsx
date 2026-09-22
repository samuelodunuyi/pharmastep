import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | PharmaStep Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const pendingPrescriptions = await db.order.count({ where: { prescriptionStatus: "PENDING_REVIEW", status: "PAID" } });

  return (
    <div className="min-h-screen bg-muted lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="border-b bg-background lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div className="px-5 py-4">
          <Logo showMark={false} suffix={<Badge variant="secondary">Admin</Badge>} />
        </div>
        <AdminNav isAdmin={staff.role === "ADMIN"} pendingPrescriptions={pendingPrescriptions} />
        <p className="hidden px-5 py-4 text-xs text-muted-foreground lg:block">
          Signed in as {staff.email}
          <br />
          <span className="font-semibold capitalize">{staff.role.toLowerCase()}</span>
        </p>
      </aside>
      <div className="min-w-0 p-4 sm:p-8">{children}</div>
    </div>
  );
}
