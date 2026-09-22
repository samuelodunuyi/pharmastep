// Shared setup for one-off scripts (run with `npx tsx scripts/<name>.ts`).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
  return value;
}

export const prisma = new PrismaClient({
  // Scripts use the direct connection; long-running batches don't suit the transaction pooler.
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? requireEnv("DATABASE_URL") }),
});

export function supabaseAdmin() {
  // Accept the REST endpoint URL too (…/rest/v1/); the client needs just the origin.
  return createClient(new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL")).origin, requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Same slug rules as the app, so imported categories match /category/<old id> redirects.
export { slugify } from "../src/lib/format";

/**
 * Categories from the old site, keyed by the Firestore `product_type` value.
 * No images: the store shows illustrated artwork until an admin uploads one.
 */
export const LEGACY_CATEGORIES: { id: string; name: string }[] = [
  { id: "Antibacterial", name: "Antibacterials" },
  { id: "Anti_Malarials", name: "Anti Malarials" },
  { id: "Contraceptives", name: "Contraceptives" },
  { id: "Cream_and_ointments", name: "Creams and ointments" },
  { id: "Antidiabetics", name: "Antidiabetics" },
  { id: "Antihypertensives", name: "Antihypertensives" },
  { id: "Skincare", name: "Skincare" },
  { id: "Pain_management", name: "Pain management" },
  { id: "Pessaries", name: "Pessaries" },
  { id: "Antihistamines", name: "Antihistamines" },
  { id: "Antiemetics", name: "Antiemetics" },
  { id: "Antipsychotics", name: "Antipsychotics" },
  { id: "Vitamins", name: "Vitamins" },
  { id: "Gastrointestinal", name: "Gastrointestinal" },
  { id: "Sexual_health", name: "Sexual health" },
];
