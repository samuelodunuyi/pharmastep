"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireProfile } from "@/lib/auth";
import { emailSchema, fieldErrorsFrom, fullNameSchema, phoneSchema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";
import { rateLimitByIp, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit";

const ProfileSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema.or(z.literal("")),
});

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const parsed = ProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: String(formData.get("phone") ?? "").trim(),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await db.profile.update({
    where: { id: profile.id },
    data: { fullName: parsed.data.fullName, phone: parsed.data.phone || null },
  });
  revalidatePath("/account");
  return { message: "Saved." };
}

const ContactSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  subject: z.string().trim().min(2, "Enter a subject.").max(150),
  message: z.string().trim().min(10, "Your message is a bit short.").max(3000),
});

export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const thanks = { message: "Thanks! We’ll get back to you soon." };
  // Honeypot field that real users never see.
  if (formData.get("website")) return thanks;
  const parsed = ContactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  if (!(await rateLimitByIp("contact", { limit: 5, windowSeconds: 60 * 60 }))) return { error: TOO_MANY_ATTEMPTS };
  await db.contactMessage.create({ data: parsed.data });
  return thanks;
}
