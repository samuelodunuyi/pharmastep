import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { staffSignOutAction } from "@/app/actions/staff-auth";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const pendingPrescriptions = await db.order.count({ where: { prescriptionStatus: "PENDING_REVIEW", status: "PAID" } });

  return (
    <div className="min-h-screen bg-muted lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="border-b bg-background lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
        <div className="px-5 py-4">
          <Logo showMark={false} suffix={<Badge variant="secondary">Admin</Badge>} />
        </div>
        <AdminNav isAdmin={staff.role === "ADMIN"} pendingPrescriptions={pendingPrescriptions} />
        <div className="flex items-center justify-between gap-2 border-t px-5 py-3 text-xs text-muted-foreground lg:mt-auto lg:block lg:space-y-2">
          <p className="min-w-0 truncate">
            {staff.fullName ?? staff.email}
            <span className="ml-1 font-semibold capitalize lg:ml-0 lg:block">{staff.role.toLowerCase()}</span>
          </p>
          <form action={staffSignOutAction}>
            <SubmitButton variant="outline" size="sm" icon={<LogOut />}>Sign out</SubmitButton>
          </form>
        </div>
      </aside>
      <div className="min-w-0 p-4 sm:p-8">{children}</div>
    </div>
  );
}
