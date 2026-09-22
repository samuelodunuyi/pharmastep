"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isStaff, requireStaff } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-state";

const WRONG_DETAILS = "Email or password is incorrect.";

export async function staffSignInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: WRONG_DETAILS };

  const profile = await db.profile.findUnique({ where: { id: data.user.id } });
  if (!isStaff(profile)) {
    // Customer accounts can't use the staff sign-in. Same message, so it doesn't reveal which emails are customers.
    await supabase.auth.signOut();
    return { error: WRONG_DETAILS };
  }

  revalidatePath("/", "layout");
  redirect(profile!.mustChangePassword ? "/admin/change-password" : "/admin");
}

export async function changeStaffPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff(false, { allowPendingPasswordChange: true });
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { fieldErrors: { password: `Use at least ${MIN_PASSWORD_LENGTH} characters.` } };
  }
  if (password !== confirm) return { fieldErrors: { confirm: "Passwords don’t match." } };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.code === "same_password" ? "Choose a password different from the temporary one." : error.message };
  }

  await db.profile.update({ where: { id: staff.id }, data: { mustChangePassword: false } });
  redirect("/admin");
}

export async function staffSignOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
