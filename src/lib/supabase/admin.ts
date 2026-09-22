import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isStorageConfigured, supabaseUrl } from "@/lib/env";

/** Privileged client (secret key). Server only: storage uploads, signed URLs, staff accounts. */
export function createSupabaseAdminClient() {
  if (!isStorageConfigured()) {
    throw new Error("This needs SUPABASE_SECRET_KEY, which isn’t set.");
  }
  return createClient(supabaseUrl(), process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
