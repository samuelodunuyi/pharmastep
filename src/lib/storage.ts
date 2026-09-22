import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_BUCKET = "product-images"; // public
export const PRESCRIPTION_BUCKET = "prescriptions"; // private

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const RX_TYPES = [...IMAGE_TYPES, "application/pdf"];

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type === "application/pdf" ? "pdf" : "jpg";
}

export async function uploadProductImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Images must be JPG, PNG or WebP.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");

  const supabase = createSupabaseAdminClient();
  const path = `products/${randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function validatePrescriptionFile(file: File | null) {
  if (!file || file.size === 0) return "Please upload a photo or PDF of your prescription.";
  if (!RX_TYPES.includes(file.type)) return "Prescription must be a JPG, PNG, WebP or PDF file.";
  if (file.size > 6 * 1024 * 1024) return "Prescription file must be 6 MB or smaller.";
  return null;
}

export async function uploadPrescription(file: File, orderReference: string) {
  const supabase = createSupabaseAdminClient();
  const path = `${orderReference}/${randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(PRESCRIPTION_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Prescription upload failed: ${error.message}`);
  return path;
}

/** Short-lived link for staff to view a prescription. */
export async function prescriptionSignedUrl(path: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.storage.from(PRESCRIPTION_BUCKET).createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
