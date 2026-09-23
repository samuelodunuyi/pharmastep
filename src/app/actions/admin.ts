"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { isStaff, requireStaff } from "@/lib/auth";
import { nairaToKobo, slugify } from "@/lib/format";
import { generateTempPassword } from "@/lib/passwords";
import { emailOrderUpdate } from "@/lib/email";
import { refundTransaction } from "@/lib/paystack";
import { uploadProductImage } from "@/lib/storage";
import { randomCode } from "@/lib/orders";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailSchema, fieldErrorsFrom, fullNameSchema } from "@/lib/validation";
import type { OrderStatus } from "@/generated/prisma/client";
import type { FormState } from "@/lib/form-state";

// ---------- Orders & prescriptions (pharmacists and admins) ----------

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ["PROCESSING"],
  PROCESSING: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

export async function updateOrderStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const orderId = String(formData.get("orderId"));
  const status = String(formData.get("status")) as OrderStatus;
  const note = String(formData.get("note") ?? "").trim();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found." };
  if (!NEXT_STATUS[order.status]?.includes(status)) {
    return { error: `Can’t move an order from ${order.status} to ${status}.` };
  }
  if (order.prescriptionStatus === "PENDING_REVIEW" || order.prescriptionStatus === "REJECTED") {
    return { error: "The prescription must be approved before this order can progress." };
  }

  const defaultNote: Record<string, string> = {
    PROCESSING: "Your order is being prepared by our pharmacy team.",
    OUT_FOR_DELIVERY: "Your order is on its way.",
    DELIVERED: "Your order has been delivered. Get well soon!",
  };

  const customerNote = note || defaultNote[status];
  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status } }),
    db.orderEvent.create({ data: { orderId, status, note: customerNote, actorId: staff.id } }),
  ]);
  await emailOrderUpdate(orderId, customerNote);
  revalidatePath(`/admin/orders/${orderId}`);
  return { message: "Order updated." };
}

export async function addOrderNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const orderId = String(formData.get("orderId"));
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { error: "Write a note first." };
  await db.orderEvent.create({ data: { orderId, note, actorId: staff.id } });
  await emailOrderUpdate(orderId, note);
  revalidatePath(`/admin/orders/${orderId}`);
  return { message: "Update posted. The customer can see it on their order page and gets it by email." };
}

/**
 * Cancels an order, refunding it through Paystack if it was paid. `note` is for staff; `customerMessage`
 * is what the customer is told (null when a failed refund needs staff to step in first).
 */
async function refundOrder(orderId: string, reason: string, actorId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (!order.paidAt || !order.paystackRef) {
    const customerMessage = `Your order has been cancelled. ${reason}`;
    await db.$transaction([
      db.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } }),
      db.orderEvent.create({ data: { orderId, status: "CANCELLED", note: customerMessage, actorId } }),
    ]);
    return { refunded: false, note: "Order cancelled (it was not paid).", customerMessage };
  }
  try {
    await refundTransaction(order.paystackRef, reason);
    await db.$transaction([
      db.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } }),
      db.orderEvent.create({
        data: { orderId, status: "REFUNDED", note: `Order cancelled and a full refund was issued. ${reason}`, actorId },
      }),
      // Put stock back.
      ...(await db.orderItem.findMany({ where: { orderId, productId: { not: null } } })).map((i) =>
        db.product.update({ where: { id: i.productId! }, data: { stock: { increment: i.quantity } } }),
      ),
    ]);
    return { refunded: true, note: "Refund issued via Paystack.", customerMessage: `Your order has been cancelled and a full refund was issued. ${reason}` };
  } catch (err) {
    console.error("Refund failed", err);
    await db.orderEvent.create({
      data: { orderId, note: `Automatic refund failed. Refund manually in the Paystack dashboard. (${reason})`, actorId, internal: true },
    });
    return { refunded: false, note: "Paystack refund failed. Please refund manually from the Paystack dashboard.", customerMessage: null };
  }
}

export async function reviewPrescriptionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const orderId = String(formData.get("orderId"));
  const decision = String(formData.get("decision"));
  const note = String(formData.get("note") ?? "").trim();

  const order = await db.order.findUnique({ where: { id: orderId }, include: { prescription: true } });
  if (!order?.prescription) return { error: "No prescription on this order." };
  if (order.prescriptionStatus !== "PENDING_REVIEW") return { error: "This prescription has already been reviewed." };
  if (decision === "reject" && !note) return { error: "Give the customer a reason for rejecting." };

  const approved = decision === "approve";
  await db.$transaction([
    db.prescription.update({
      where: { id: order.prescription.id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        reviewerId: staff.id,
        reviewNote: note || null,
        reviewedAt: new Date(),
      },
    }),
    db.order.update({
      where: { id: orderId },
      data: { prescriptionStatus: approved ? "APPROVED" : "REJECTED" },
    }),
    db.orderEvent.create({
      data: {
        orderId,
        note: approved ? "Your prescription was approved by our pharmacist." : `Your prescription could not be approved: ${note}`,
        actorId: staff.id,
      },
    }),
  ]);

  let message = approved ? "Prescription approved." : "Prescription rejected.";
  if (approved) {
    await emailOrderUpdate(orderId, "Your prescription was approved by our pharmacist. We're preparing your order.");
  } else {
    const result = await refundOrder(orderId, "Prescription not approved.", staff.id);
    message += ` ${result.note}`;
    const outcome = result.customerMessage ?? "Your order will be cancelled and we'll contact you about your refund.";
    await emailOrderUpdate(orderId, `Your prescription could not be approved: ${note}

${outcome}`);
  }
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/prescriptions");
  return { message };
}

export async function cancelOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff(true);
  const orderId = String(formData.get("orderId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Give a reason for cancelling." };
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)) {
    return { error: "This order can’t be cancelled." };
  }
  const result = await refundOrder(orderId, reason, staff.id);
  if (result.customerMessage) await emailOrderUpdate(orderId, result.customerMessage);
  revalidatePath(`/admin/orders/${orderId}`);
  return result.refunded ? { message: result.note } : { error: result.note };
}

// ---------- Catalog (admins only) ----------

const optional = z
  .string()
  .trim()
  .transform((s) => s || null);

const ProductSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(200),
  manufacturer: optional,
  description: optional,
  activeIngredient: optional,
  strength: optional,
  packSize: optional,
  dosageForm: optional,
  nafdacNumber: optional,
  price: z.coerce.number().positive("Price must be more than 0."),
  compareAtPrice: z
    .string()
    .trim()
    .transform((s) => (s ? Number(s) : null))
    .refine((n) => n === null || (Number.isFinite(n) && n > 0), "Compare-at price must be a number."),
  stock: z.coerce.number().int().min(0, "Stock can’t be negative."),
  // The category picker sends "none" for no category.
  categoryId: optional.transform((s) => (s === "none" ? null : s)),
  tags: z.string().transform((s) =>
    s
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  ),
  expiryDate: z
    .string()
    .trim()
    .transform((s) => (s ? new Date(s) : null)),
});

export async function saveProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff(true);
  const id = String(formData.get("id") ?? "") || null;
  const parsed = ProductSchema.safeParse({
    name: formData.get("name") ?? "",
    manufacturer: formData.get("manufacturer") ?? "",
    description: formData.get("description") ?? "",
    activeIngredient: formData.get("activeIngredient") ?? "",
    strength: formData.get("strength") ?? "",
    packSize: formData.get("packSize") ?? "",
    dosageForm: formData.get("dosageForm") ?? "",
    nafdacNumber: formData.get("nafdacNumber") ?? "",
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") ?? "",
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId") ?? "",
    tags: formData.get("tags") ?? "",
    expiryDate: formData.get("expiryDate") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Existing images the admin kept (in order), plus any new uploads.
  const kept = formData.getAll("keepImage").map(String);
  const uploads = formData.getAll("newImages").filter((f): f is File => f instanceof File && f.size > 0);
  let uploaded: string[] = [];
  try {
    uploaded = await Promise.all(uploads.map(uploadProductImage));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Image upload failed." };
  }

  const data = {
    name: d.name,
    manufacturer: d.manufacturer,
    description: d.description,
    activeIngredient: d.activeIngredient,
    strength: d.strength,
    packSize: d.packSize,
    dosageForm: d.dosageForm,
    nafdacNumber: d.nafdacNumber,
    priceKobo: nairaToKobo(d.price),
    compareAtPriceKobo: d.compareAtPrice ? nairaToKobo(d.compareAtPrice) : null,
    stock: d.stock,
    categoryId: d.categoryId,
    tags: d.tags,
    expiryDate: d.expiryDate,
    requiresPrescription: formData.get("requiresPrescription") === "on",
    isActive: formData.get("isActive") === "on",
    images: [...kept, ...uploaded],
  };

  let savedId = id;
  if (id) {
    await db.product.update({ where: { id }, data });
  } else {
    const created = await db.product.create({ data: { ...data, slug: `${slugify(d.name)}-${randomCode(4).toLowerCase()}` } });
    savedId = created.id;
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products/${savedId}?saved=1`);
}

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff(true);
  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  if (name.length < 2) return { error: "Enter a category name." };

  const image = formData.get("image");
  let imageUrl: string | undefined;
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await uploadProductImage(image);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Image upload failed." };
    }
  }

  if (id) {
    await db.category.update({ where: { id }, data: { name, sortOrder, ...(imageUrl ? { imageUrl } : {}) } });
  } else {
    const slug = slugify(name);
    if (await db.category.findUnique({ where: { slug } })) return { error: "A category with that name already exists." };
    await db.category.create({ data: { name, slug, sortOrder, imageUrl } });
  }
  revalidatePath("/", "layout");
  return { message: "Category saved." };
}

export async function deleteCategoryAction(formData: FormData) {
  await requireStaff(true);
  await db.category.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/", "layout");
}

// ---------- Staff & messages ----------

// Staff accounts are separate from customer accounts: they're only ever created here (or by
// scripts/create-admin.ts), with a temporary password the person must change at first sign-in.

const STAFF_ROLES = ["PHARMACIST", "ADMIN"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

const NewStaffSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  role: z.enum(STAFF_ROLES),
});

function oneTimePassword(value: string) {
  return { label: "Temporary password (shown once)", value };
}

export async function addStaffAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff(true);
  const parsed = NewStaffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };
  const { fullName, email, role } = parsed.data;

  const emailTaken = "An account with this email already exists. Staff need their own email address, separate from any customer account.";
  if (await db.profile.findUnique({ where: { email } })) return { fieldErrors: { email: emailTaken } };

  const supabase = createSupabaseAdminClient();
  const password = generateTempPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    return error?.code === "email_exists" ? { fieldErrors: { email: emailTaken } } : { error: error?.message ?? "Couldn’t create the account." };
  }

  try {
    await db.profile.create({ data: { id: data.user.id, email, fullName, role, mustChangePassword: true } });
  } catch (err) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw err;
  }

  revalidatePath("/admin/staff");
  return {
    message: `${fullName} can now sign in at /admin/login with ${email} and this password. Share it privately; they’ll choose their own when they first sign in.`,
    reveal: oneTimePassword(password),
  };
}

/** Loads another staff member for an admin action. Admins can't act on their own account here. */
async function otherStaff(formData: FormData) {
  const admin = await requireStaff(true);
  const target = await db.profile.findUnique({ where: { id: String(formData.get("id")) } });
  if (!target || !isStaff(target)) return { error: "Staff member not found." } as const;
  if (target.id === admin.id) return { error: "You can’t change your own account here." } as const;
  return { target } as const;
}

export async function changeStaffRoleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const found = await otherStaff(formData);
  if ("error" in found) return { error: found.error };
  const role = String(formData.get("role")) as StaffRole;
  if (!STAFF_ROLES.includes(role)) return { error: "Invalid role." };
  await db.profile.update({ where: { id: found.target.id }, data: { role } });
  revalidatePath("/admin/staff");
  return { message: "Role updated." };
}

export async function resetStaffPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const found = await otherStaff(formData);
  if ("error" in found) return { error: found.error };
  const password = generateTempPassword();
  const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(found.target.id, { password });
  if (error) return { error: error.message };
  await db.profile.update({ where: { id: found.target.id }, data: { mustChangePassword: true } });
  return { message: "Password reset. They’ll choose a new one at their next sign-in.", reveal: oneTimePassword(password) };
}

export async function removeStaffAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const found = await otherStaff(formData);
  if ("error" in found) return { error: found.error };
  // Deleting the login also ends their sessions. Their past order updates and reviews stay, unattributed.
  const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(found.target.id);
  if (error && error.status !== 404) return { error: error.message };
  await db.profile.delete({ where: { id: found.target.id } });
  revalidatePath("/admin/staff");
  return { message: `${found.target.email} no longer has access.` };
}

export async function markMessageHandledAction(formData: FormData) {
  await requireStaff();
  await db.contactMessage.update({ where: { id: String(formData.get("id")) }, data: { handled: true } });
  revalidatePath("/admin/messages");
}
