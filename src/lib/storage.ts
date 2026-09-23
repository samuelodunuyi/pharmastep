import "server-only";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_BUCKET = "product-images"; // public
export const PRESCRIPTION_BUCKET = "prescriptions"; // private

const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" } as const;
type FileType = keyof typeof EXTENSIONS;
const IMAGE_TYPES: FileType[] = ["image/jpeg", "image/png", "image/webp"];
const RX_TYPES: FileType[] = [...IMAGE_TYPES, "application/pdf"];

/**
 * The file's real type, read from its first bytes. The type and name the browser sends can be anything,
 * so they're never trusted for what gets stored.
 */
async function detectType(file: File): Promise<FileType | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 4) === "%PDF") return "application/pdf";
  return null;
}

export async function uploadProductImage(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Images must be 5 MB or smaller.");
  const type = await detectType(file);
  if (!type || !IMAGE_TYPES.includes(type)) throw new Error("Images must be JPG, PNG or WebP.");

  const supabase = createSupabaseAdminClient();
  const path = `products/${randomUUID()}.${EXTENSIONS[type]}`;
  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(path, file, { contentType: type, cacheControl: "31536000" });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function validatePrescriptionFile(file: File | null) {
  if (!file || file.size === 0) return "Please upload a photo or PDF of your prescription.";
  if (file.size > 6 * 1024 * 1024) return "Prescription file must be 6 MB or smaller.";
  const type = await detectType(file);
  if (!type || !RX_TYPES.includes(type)) return "Prescription must be a JPG, PNG, WebP or PDF file.";
  return null;
}

/** Call after validatePrescriptionFile. */
export async function uploadPrescription(file: File, orderReference: string) {
  const type = await detectType(file);
  if (!type) throw new Error("Unsupported prescription file.");
  const supabase = createSupabaseAdminClient();
  const path = `${orderReference}/${randomUUID()}.${EXTENSIONS[type]}`;
  const { error } = await supabase.storage
    .from(PRESCRIPTION_BUCKET)
    .upload(path, file, { contentType: type });
  if (error) throw new Error(`Prescription upload failed: ${error.message}`);
  return path;
}

/** Short-lived link for staff to view a prescription. */
export async function prescriptionSignedUrl(path: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.storage.from(PRESCRIPTION_BUCKET).createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
