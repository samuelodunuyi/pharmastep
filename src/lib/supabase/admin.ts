import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isStorageConfigured, supabaseUrl } from "@/lib/env";

/** Privileged client (secret key). Server only: storage uploads, signed URLs, user admin. */
export function createSupabaseAdminClient() {
  if (!isStorageConfigured()) {
    throw new Error("File uploads aren’t set up yet (SUPABASE_SECRET_KEY is missing).");
  }
  return createClient(supabaseUrl(), process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
