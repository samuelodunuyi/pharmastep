import "server-only";
import { cache } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import { db } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/generated/prisma/client";

type SessionUser = { id: string; email: string; fullName?: string };

/** The signed-in Supabase user for this request, verified from the JWT. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Not configured, or Supabase unreachable: treat everyone as signed out rather than failing the page.
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims?.sub || !claims.email) return null;
    const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
    const fullName = (meta.full_name ?? meta.name) as string | undefined;
    return { id: claims.sub, email: claims.email as string, fullName };
  } catch (err) {
    // Let Next.js's own control-flow errors (dynamic rendering, redirects) through.
    unstable_rethrow(err);
    console.error("Could not read Supabase session", err);
    return null;
  }
});

/** The signed-in user's profile row, created on first sight (covers email and Google sign-ups). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  return ensureProfile(user);
});

/** `extra` only fills in a newly created profile; existing profiles are never overwritten. */
export async function ensureProfile(user: SessionUser, extra?: { fullName?: string; phone?: string }) {
  const existing = await db.profile.findUnique({ where: { id: user.id } });
  if (existing) return existing;

  // Imported Firebase customers already have a profile keyed by email; attach it to the new auth id.
  // Never do this for staff profiles, or a new sign-up could inherit staff access.
  const legacy = await db.profile.findUnique({ where: { email: user.email.toLowerCase() } });
  if (legacy) {
    if (legacy.role !== "CUSTOMER") throw new Error("This email belongs to a staff account.");
    return db.profile.update({ where: { email: legacy.email }, data: { id: user.id } });
  }

  return db.profile.create({
    data: {
      id: user.id,
      email: user.email.toLowerCase(),
      fullName: extra?.fullName ?? user.fullName ?? null,
      phone: extra?.phone ?? null,
    },
  });
}

export async function requireProfile(next = "/account") {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(next)}`);
  return profile;
}

export function isStaff(profile: Pick<Profile, "role"> | null) {
  return profile?.role === "ADMIN" || profile?.role === "PHARMACIST";
}

/**
 * Admin area guard. Staff sign in at /admin/login, never through the customer pages.
 * Pharmacists can review prescriptions and orders; only admins manage the catalog and staff.
 */
export async function requireStaff(adminOnly = false, { allowPendingPasswordChange = false } = {}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (!isStaff(profile)) redirect("/admin/login?error=not-staff");
  if (profile.mustChangePassword && !allowPendingPasswordChange) redirect("/admin/change-password");
  if (adminOnly && profile.role !== "ADMIN") redirect("/admin");
  return profile;
}
