"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { emailSchema, fieldErrorsFrom, fullNameSchema, phoneSchema, safeRedirectPath } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") return { error: "Please confirm your email first. Check your inbox." };
    return {
      error:
        "Email or password is incorrect. If you had an account on our old website, use “Forgot password” to set a new password.",
    };
  }

  await ensureProfile({ id: data.user.id, email: data.user.email! });
  await mergeGuestCart(data.user.id);
  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("next")));
}

const SignUpSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don’t match.", path: ["confirm"] });

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = SignUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  const { fullName, email, phone, password } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: `${site()}/auth/callback?next=/account`,
    },
  });
  if (error) {
    if (error.code === "user_already_exists") return { error: "An account with this email already exists. Please sign in." };
    return { error: error.message };
  }
  // With email confirmation on (recommended), there is no session until the link is clicked;
  // the profile is created in /auth/callback from the metadata above.
  if (!data.session || !data.user) {
    return { message: "Almost done! We’ve sent a confirmation link to your email." };
  }
  await ensureProfile({ id: data.user.id, email }, { fullName, phone });
  await mergeGuestCart(data.user.id);
  revalidatePath("/", "layout");
  redirect(safeRedirectPath(formData.get("next")));
}

export async function signInWithGoogleAction(formData: FormData) {
  const next = safeRedirectPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${site()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site()}/auth/callback?next=/reset-password`,
  });
  // Same message whether or not the account exists.
  return { message: "If an account exists for that email, we’ve sent a link to set a new password." };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== formData.get("confirm")) return { error: "Passwords don’t match." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Your reset link has expired. Please request a new one." };
  redirect("/account?password=updated");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
