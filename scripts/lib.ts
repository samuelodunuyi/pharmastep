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
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Same slug rules as the app, so imported categories match /category/<old id> redirects.
export { slugify } from "../src/lib/format";

/** Categories from the old site, keyed by the Firestore `product_type` value. */
export const LEGACY_CATEGORIES: { id: string; name: string; image: string }[] = [
  { id: "Antibacterial", name: "Antibacterials", image: "antimicrobial.jpg" },
  { id: "Anti_Malarials", name: "Anti Malarials", image: "malaria.jpg" },
  { id: "Contraceptives", name: "Contraceptives", image: "contraceptives.jpg" },
  { id: "Cream_and_ointments", name: "Creams and ointments", image: "creams.jpg" },
  { id: "Antidiabetics", name: "Antidiabetics", image: "antidiabetic.jpg" },
  { id: "Antihypertensives", name: "Antihypertensives", image: "antihypertensive.jpg" },
  { id: "Skincare", name: "Skincare", image: "derm.jpg" },
  { id: "Pain_management", name: "Pain management", image: "headaches.jpg" },
  { id: "Pessaries", name: "Pessaries", image: "pessaries.png" },
  { id: "Antihistamines", name: "Antihistamines", image: "Antihistamines.jpg" },
  { id: "Antiemetics", name: "Antiemetics", image: "antiemetics.jpg" },
  { id: "Antipsychotics", name: "Antipsychotics", image: "Antipsychotics.jpg" },
  { id: "Vitamins", name: "Vitamins", image: "vitamins.jpg" },
  { id: "Gastrointestinal", name: "Gastrointestinal", image: "Gastrointestinal.jpg" },
  { id: "Sexual_health", name: "Sexual health", image: "sexual.jpg" },
];
