import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { StaffChangePasswordForm } from "@/components/admin/staff-auth-forms";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Set your password" };

export default async function StaffChangePasswordPage() {
  const staff = await requireStaff(false, { allowPendingPasswordChange: true });
  return (
    <AuthCard
      title={staff.mustChangePassword ? "Set your password" : "Change your password"}
      description={
        staff.mustChangePassword
          ? "You signed in with a temporary password. Choose your own to continue."
          : `Signed in as ${staff.email}.`
      }
    >
      <StaffChangePasswordForm />
    </AuthCard>
  );
}
