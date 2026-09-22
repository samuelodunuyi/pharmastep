import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

/** Refreshes the Supabase session cookie on every page request. Access control lives in the pages. */
export async function proxy(request: NextRequest) {
  // Not configured yet: let the request through so the app can show its setup page.
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  try {
    await supabase.auth.getClaims();
  } catch (err) {
    // A wrong URL or an unreachable Supabase shouldn't take the whole site down.
    console.error("Supabase session refresh failed", err);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets, images and the Paystack webhook.
    "/((?!_next/static|_next/image|favicon.ico|images/|api/paystack/webhook|.*\\.(?:png|jpg|jpeg|gif|svg|webp)$).*)",
  ],
};
