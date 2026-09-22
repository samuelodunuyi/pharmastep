import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormMessage } from "@/components/ui/form-message";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/auth-forms";
import { getSessionUser } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  link: "That link is invalid or has expired. Please try again.",
  google: "Google sign-in couldn’t be started. Please try again.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = safeRedirectPath(sp.next);
  if (await getSessionUser()) redirect(next);
  const error = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to track orders and check out faster."
      footer={<>New to PharmaStep? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">Create an account</Link></>}
    >
      <FormMessage state={{ error }} className="mb-4" />
      <SignInForm next={next} />
    </AuthCard>
  );
}
