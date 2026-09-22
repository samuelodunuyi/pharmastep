import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage() {
  // The reset link signs the user in via /auth/callback first.
  if (!(await getSessionUser())) redirect("/forgot-password");
  return (
    <AuthCard title="Set a new password">
      <ResetPasswordForm />
    </AuthCard>
  );
}
