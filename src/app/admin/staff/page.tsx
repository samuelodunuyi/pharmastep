import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StaffRoleForm } from "@/components/admin/staff-role-form";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  await requireStaff(true);
  const staff = await db.profile.findMany({ where: { role: { not: "CUSTOMER" } }, orderBy: { email: "asc" } });

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        size="sm"
        title="Staff"
        className="mb-0"
        description={
          <>
            <strong>Pharmacists</strong> review prescriptions and fulfil orders. <strong>Admins</strong> can also manage products,
            categories, staff and refunds. The person must have signed up on the site first.
          </>
        }
      />
      <Card><CardContent><StaffRoleForm /></CardContent></Card>
      <Card className="py-0">
        <ul className="divide-y">
          {staff.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.fullName ?? s.email}</p>
                <p className="truncate text-muted-foreground">{s.email}</p>
              </div>
              <Badge variant={s.role === "ADMIN" ? "default" : "secondary"} className="capitalize">{s.role.toLowerCase()}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
