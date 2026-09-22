import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/auth-forms";
import { getSessionUser } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage(props: PageProps<"/register">) {
  const next = safeRedirectPath((await props.searchParams).next);
  if (await getSessionUser()) redirect(next);

  return (
    <AuthCard
      title="Create your account"
      description="Save your details, track orders and reorder in a tap."
      footer={<>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">Sign in</Link></>}
    >
      <SignUpForm next={next} />
    </AuthCard>
  );
}
