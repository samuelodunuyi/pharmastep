/**
 * Configuration checks, so a fresh clone or a deploy with missing settings shows a setup page
 * (and features degrade with a clear message) instead of crashing.
 */

type EnvVar = { name: string; purpose: string };

/** Without these the site can't load at all. */
export const REQUIRED_ENV: EnvVar[] = [
  { name: "DATABASE_URL", purpose: "Database connection for products, carts and orders" },
  { name: "NEXT_PUBLIC_SUPABASE_URL", purpose: "Supabase project URL, used for sign-in" },
  { name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", purpose: "Supabase publishable key, used for sign-in" },
];

/** The site works without these, but the named feature is switched off. */
export const OPTIONAL_ENV: EnvVar[] = [
  { name: "PAYSTACK_SECRET_KEY", purpose: "Taking payments at checkout" },
  { name: "SUPABASE_SECRET_KEY", purpose: "Prescription and product image uploads" },
  { name: "GOOGLE_MAPS_API_KEY", purpose: "Distance-based delivery fees (a flat fee is used without it)" },
];

// NEXT_PUBLIC_ values must be read with literal names so Next.js can inline them in client bundles.
function read(name: string): string | undefined {
  const values: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
  const value = name in values ? values[name] : process.env[name];
  return value?.trim() ? value : undefined;
}

export function missingEnv(vars: EnvVar[]) {
  return vars.filter((v) => !read(v.name));
}

export function isSupabaseConfigured() {
  return !!read("NEXT_PUBLIC_SUPABASE_URL") && !!read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export const isPaymentsConfigured = () => !!read("PAYSTACK_SECRET_KEY");
export const isStorageConfigured = () => isSupabaseConfigured() && !!read("SUPABASE_SECRET_KEY");
