"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { nairaToKobo, slugify } from "@/lib/format";
import { refundTransaction } from "@/lib/paystack";
import { uploadProductImage } from "@/lib/storage";
import { randomCode } from "@/lib/orders";
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

  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status } }),
    db.orderEvent.create({ data: { orderId, status, note: note || defaultNote[status], actorId: staff.id } }),
  ]);
  revalidatePath(`/admin/orders/${orderId}`);
  return { message: "Order updated." };
}

export async function addOrderNoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const orderId = String(formData.get("orderId"));
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return { error: "Write a note first." };
  await db.orderEvent.create({ data: { orderId, note, actorId: staff.id } });
  revalidatePath(`/admin/orders/${orderId}`);
  return { message: "Update posted. The customer can see it on their order page." };
}

async function refundOrder(orderId: string, reason: string, actorId: string) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (!order.paidAt || !order.paystackRef) {
    await db.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    return { refunded: false, note: "Order cancelled (it was not paid)." };
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
    return { refunded: true, note: "Refund issued via Paystack." };
  } catch (err) {
    console.error("Refund failed", err);
    await db.orderEvent.create({
      data: { orderId, note: `Automatic refund failed. Refund manually in the Paystack dashboard. (${reason})`, actorId },
    });
    return { refunded: false, note: "Paystack refund failed. Please refund manually from the Paystack dashboard." };
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
  if (!approved) {
    const result = await refundOrder(orderId, "Prescription not approved.", staff.id);
    message += ` ${result.note}`;
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

export async function setRoleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireStaff(true);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role"));
  if (!["CUSTOMER", "PHARMACIST", "ADMIN"].includes(role)) return { error: "Invalid role." };
  const profile = await db.profile.findUnique({ where: { email } });
  if (!profile) return { error: "No account with that email. Ask them to sign up first." };
  if (profile.id === admin.id && role !== "ADMIN") return { error: "You can’t remove your own admin access." };
  await db.profile.update({ where: { email }, data: { role: role as "CUSTOMER" | "PHARMACIST" | "ADMIN" } });
  revalidatePath("/admin/staff");
  return { message: `${email} is now ${role.toLowerCase()}.` };
}

export async function markMessageHandledAction(formData: FormData) {
  await requireStaff();
  await db.contactMessage.update({ where: { id: String(formData.get("id")) }, data: { handled: true } });
  revalidatePath("/admin/messages");
}
