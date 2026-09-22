import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AddStaffForm, StaffMemberActions } from "@/components/admin/staff-forms";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const me = await requireStaff(true);
  const staff = await db.profile.findMany({ where: { role: { not: "CUSTOMER" } }, orderBy: [{ role: "asc" }, { email: "asc" }] });

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        size="sm"
        title="Staff"
        className="mb-0"
        description={
          <>
            <strong>Pharmacists</strong> review prescriptions and fulfil orders. <strong>Admins</strong> can also manage products,
            categories, staff and refunds. Staff sign in at <code>/admin/login</code>.
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Add staff member</CardTitle>
          <CardDescription>
            Use a work email that isn’t already a customer account. You’ll get a temporary password to pass on; they choose their own at first
            sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent><AddStaffForm /></CardContent>
      </Card>

      <Card className="py-0">
        <ul className="divide-y">
          {staff.map((s) => (
            <li key={s.id} className="flex flex-col gap-4 p-4 text-sm sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="truncate font-semibold">{s.fullName ?? s.email}</p>
                <p className="truncate text-muted-foreground">{s.email}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={s.role === "ADMIN" ? "default" : "secondary"} className="capitalize">{s.role.toLowerCase()}</Badge>
                  {s.mustChangePassword && <Badge variant="warning">Must set password</Badge>}
                  {s.id === me.id && <Badge variant="outline">You</Badge>}
                </div>
              </div>
              {s.id !== me.id && <StaffMemberActions id={s.id} email={s.email} role={s.role} />}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
