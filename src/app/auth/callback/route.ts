import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { safeRedirectPath } from "@/lib/validation";

// Handles Google sign-in, email confirmation and password-reset links.
// Supports both the PKCE `code` flow and the `token_hash` flow used by custom email templates.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeRedirectPath(params.get("next"));

  const supabase = await createSupabaseServerClient();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  let user = null;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) user = data.user;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) user = data.user;
  }

  if (!user?.email) {
    return NextResponse.redirect(new URL("/login?error=link", request.url));
  }

  const meta = user.user_metadata ?? {};
  await ensureProfile(
    { id: user.id, email: user.email, fullName: meta.full_name ?? meta.name },
    { phone: meta.phone },
  );
  await mergeGuestCart(user.id);

  return NextResponse.redirect(new URL(type === "recovery" ? "/reset-password" : next, request.url));
}
