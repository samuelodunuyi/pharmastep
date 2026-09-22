import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormMessage } from "@/components/ui/form-message";
import { AuthCard } from "@/components/auth/auth-card";
import { StaffSignInForm } from "@/components/admin/staff-auth-forms";
import { getCurrentProfile, isStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Staff sign-in" };

export default async function StaffLoginPage(props: PageProps<"/admin/login">) {
  const profile = await getCurrentProfile();
  if (isStaff(profile)) redirect(profile!.mustChangePassword ? "/admin/change-password" : "/admin");

  const notStaff = (await props.searchParams).error === "not-staff" || !!profile;

  return (
    <AuthCard title="Staff sign-in" description="For PharmaStep pharmacists and administrators.">
      {notStaff && (
        <FormMessage
          className="mb-4"
          state={{ error: "You’re signed in with a customer account, which can’t access this area. Sign in with your staff account." }}
        />
      )}
      <StaffSignInForm />
    </AuthCard>
  );
}
