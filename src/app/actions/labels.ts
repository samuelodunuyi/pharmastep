"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldErrorsFrom } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((s) => s || null);

const LabelSchema = z.object({
  productId: z.string().min(1),
  directions: z.string().trim().min(10, "Enter the directions as written on the pack.").max(3000),
  warnings: optionalText(3000),
  sourceUrl: optionalText(500).pipe(z.url({ protocol: /^https$/, error: "Enter a full link, starting with https://" }).nullable()),
  notes: optionalText(2000),
  decision: z.enum(["draft", "approve"]),
});

/**
 * Saves a product's pack label. "approve" records the pharmacist who checked it against the pack;
 * any other save puts it back to draft, so customers and the chat assistant only ever see approved text.
 */
export async function saveLabelAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const parsed = LabelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
  const { productId, decision, ...label } = parsed.data;

  const product = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
  if (!product) return { error: "Product not found." };

  const review =
    decision === "approve"
      ? { status: "APPROVED" as const, reviewedById: staff.id, reviewedAt: new Date() }
      : { status: "DRAFT" as const, reviewedById: null, reviewedAt: null };
  await db.productLabel.upsert({
    where: { productId },
    create: { productId, ...label, ...review },
    update: { ...label, ...review },
  });

  revalidatePath("/admin/labels");
  revalidatePath(`/products/${product.slug}`);
  return { message: decision === "approve" ? "Label approved. It now shows on the product page." : "Saved as a draft. It isn't shown until it's approved." };
}

export async function deleteLabelAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const productId = String(formData.get("productId"));
  const label = await db.productLabel.findUnique({ where: { productId }, include: { product: { select: { slug: true } } } });
  if (!label) return { error: "There's no label to remove." };
  await db.productLabel.delete({ where: { productId } });
  revalidatePath("/admin/labels");
  revalidatePath(`/products/${label.product.slug}`);
  return { message: "Label removed." };
}
