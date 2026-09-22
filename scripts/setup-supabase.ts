// Creates the storage buckets the app needs. Safe to run repeatedly.
//   npx tsx scripts/setup-supabase.ts
import { supabaseAdmin } from "./lib";

async function main() {
  const supabase = supabaseAdmin();
  const buckets = [
    { name: "product-images", public: true, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"] },
    // Private: only the server (secret key) can read, via short-lived signed URLs.
    { name: "prescriptions", public: false, fileSizeLimit: 6 * 1024 * 1024, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
  ];

  for (const { name, ...options } of buckets) {
    const { error } = await supabase.storage.createBucket(name, options);
    if (error && !/already exists/i.test(error.message)) throw error;
    await supabase.storage.updateBucket(name, options);
    console.log(`Bucket "${name}" ready (${options.public ? "public" : "private"}).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
