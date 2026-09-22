import { z } from "zod";

/** Nigerian mobile number, e.g. 08012345678 or +2348012345678. Spaces and dashes are stripped first. */
export const phoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+?234|0)[789][01]\d{8}$/, "Enter a Nigerian phone number, e.g. 08012345678."));

export const emailSchema = z
  .email("Enter a valid email address.")
  .transform((s) => s.trim().toLowerCase());

export const fullNameSchema = z.string().trim().min(2, "Enter a full name.").max(100);

/** Only allow same-site relative paths as post-login redirects. */
export function safeRedirectPath(value: unknown, fallback = "/account") {
  const s = Array.isArray(value) ? value[0] : value;
  return typeof s === "string" && s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}

/** First error message per field, for showing next to inputs. */
export function fieldErrorsFrom(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
