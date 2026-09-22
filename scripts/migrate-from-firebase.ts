// One-off import from the old Firebase project into Supabase + Postgres.
//
//   npx tsx scripts/migrate-from-firebase.ts [--only=products,users,orders] [--no-images] [--default-stock=50] [--dry-run]
//
// Needs FIREBASE_SERVICE_ACCOUNT_PATH (Firebase console -> Project settings -> Service accounts -> Generate key),
// plus the Supabase and database variables in .env. Safe to re-run: every record is keyed by its Firebase id.
//
// What moves:
//   products -> Product (images copied into the `product-images` bucket unless --no-images)
//   users    -> Supabase Auth users (email confirmed, no password: they use "Forgot password" once) + Profile
//   ordered_products -> Order + OrderItem, marked isLegacy
// Carts are not migrated.
import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { LEGACY_CATEGORIES, prisma, requireEnv, slugify, supabaseAdmin } from "./lib";

const args = process.argv.slice(2);
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}`));
const only = flag("only")?.split("=")[1]?.split(",") ?? ["products", "users", "orders"];
const copyImages = !flag("no-images");
const dryRun = !!flag("dry-run");
const defaultStock = Number(flag("default-stock")?.split("=")[1] ?? 50);

const serviceAccount = JSON.parse(readFileSync(requireEnv("FIREBASE_SERVICE_ACCOUNT_PATH"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const firestore = getFirestore();
const supabase = supabaseAdmin();

// ---------- helpers ----------

const toKobo = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
const toBool = (v: unknown) => v === true || ["true", "yes", "1"].includes(String(v).toLowerCase());
const toDate = (v: unknown): Date | null => {
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};
const toStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string" && x) : typeof v === "string" && v ? [v] : [];
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

async function copyImage(url: string, key: string) {
  if (!copyImages || !url.startsWith("http")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") ?? "image/jpeg";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    const path = `products/firebase/${key}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, Buffer.from(await res.arrayBuffer()), { contentType: type, upsert: true, cacheControl: "31536000" });
    if (error) throw error;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  } catch (err) {
    console.warn(`  ! could not copy image ${url}: ${(err as Error).message}. Keeping original URL.`);
    return url;
  }
}

// ---------- products ----------

async function migrateCategories() {
  const map = new Map<string, string>();
  for (const [i, c] of LEGACY_CATEGORIES.entries()) {
    const slug = slugify(c.id);
    const row = dryRun
      ? { id: slug }
      : await prisma.category.upsert({
          where: { slug },
          create: { slug, name: c.name, imageUrl: `/images/categories/${slug}.jpg`, sortOrder: i },
          update: {},
        });
    map.set(c.id.toLowerCase(), row.id);
  }
  return map;
}

async function migrateProducts() {
  const categories = await migrateCategories();
  const snap = await firestore.collection("products").get();
  console.log(`Products: ${snap.size} found in Firestore.`);
  const usedSlugs = new Set((await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug));

  let done = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const name = str(d.title) ?? `Product ${doc.id}`;
    // Only used when creating; re-runs keep the existing slug so links don't change.
    let slug = slugify(name) || doc.id.toLowerCase();
    if (usedSlugs.has(slug)) slug = `${slug}-${doc.id.slice(0, 6).toLowerCase()}`;
    usedSlugs.add(slug);

    const typeKey = String(d.product_type ?? "").toLowerCase();
    let categoryId = categories.get(typeKey) ?? null;
    if (!categoryId && typeKey && !dryRun) {
      const extraSlug = slugify(String(d.product_type));
      const created = await prisma.category.upsert({
        where: { slug: extraSlug },
        create: { slug: extraSlug, name: String(d.product_type).replace(/_/g, " "), sortOrder: 100 },
        update: {},
      });
      categories.set(typeKey, created.id);
      categoryId = created.id;
    }

    const images: string[] = [];
    for (const [i, url] of toStrings(d.images).entries()) images.push(await copyImage(url, `${doc.id}-${i}`));

    const price = toKobo(d.discount_Price ?? d.original_price);
    const original = toKobo(d.original_price);
    const data = {
      name,
      manufacturer: str(d.manufacturer),
      description: str(d.description),
      dosageForm: str(d.product_mode),
      priceKobo: price,
      compareAtPriceKobo: original > price ? original : null,
      requiresPrescription: toBool(d.control_med),
      images,
      tags: toStrings(d.search_tags).map((t) => t.toLowerCase()),
      expiryDate: toDate(d.expiry_date),
      categoryId,
    };

    if (!dryRun) {
      await prisma.product.upsert({
        where: { firebaseId: doc.id },
        // The old site had no stock tracking; new products start at --default-stock.
        create: { ...data, slug, firebaseId: doc.id, stock: defaultStock, isActive: price > 0 },
        update: data,
      });
    }
    if (++done % 25 === 0) console.log(`  ${done}/${snap.size}`);
  }
  console.log(`Products: ${done} imported. Any without a price were imported hidden; check /admin/products.`);
}

// ---------- users ----------

async function existingSupabaseUsers() {
  const byEmail = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) byEmail.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 1000) break;
  }
  return byEmail;
}

async function migrateUsers() {
  const existing = await existingSupabaseUsers();
  const profiles = new Map<string, FirebaseFirestore.DocumentData>();
  for (const doc of (await firestore.collection("users").get()).docs) profiles.set(doc.id, doc.data());

  let created = 0, linked = 0, skipped = 0;
  let pageToken: string | undefined;
  do {
    const page = await getAuth().listUsers(1000, pageToken);
    for (const fbUser of page.users) {
      const email = fbUser.email?.toLowerCase();
      if (!email) { skipped++; continue; }
      const extra = profiles.get(fbUser.uid) ?? {};
      const fullName = str(extra.fullName) ?? fbUser.displayName ?? null;
      const phone = str(extra.phone) ?? fbUser.phoneNumber ?? null;

      if (dryRun) { created++; continue; }

      let id = existing.get(email);
      if (!id) {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: fullName, phone, firebase_uid: fbUser.uid },
        });
        if (error || !data.user) {
          console.warn(`  ! ${email}: ${error?.message}`);
          skipped++;
          continue;
        }
        id = data.user.id;
        existing.set(email, id);
        created++;
      } else {
        linked++;
      }

      await prisma.profile.upsert({
        where: { email },
        create: { id, email, fullName, phone, firebaseUid: fbUser.uid },
        update: { firebaseUid: fbUser.uid, fullName: fullName ?? undefined, phone: phone ?? undefined },
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  console.log(`Users: ${created} created, ${linked} already in Supabase, ${skipped} skipped (no email or error).`);
}

// ---------- orders ----------

async function migrateOrders() {
  const snap = await firestore.collection("ordered_products").get();
  console.log(`Orders: ${snap.size} found in Firestore.`);
  const productIds = new Map(
    (await prisma.product.findMany({ where: { firebaseId: { not: null } }, select: { id: true, firebaseId: true } })).map((p) => [p.firebaseId!, p.id]),
  );
  const profileIds = new Map((await prisma.profile.findMany({ select: { id: true, email: true } })).map((p) => [p.email, p.id]));

  let done = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const email = String(d.email ?? "").toLowerCase();
    const lines = Array.isArray(d.product_uid) ? d.product_uid : [];
    const items = lines.map((l: Record<string, unknown>) => ({
      productId: productIds.get(String(l.id)) ?? null,
      productName: str(l.title) ?? "Unknown product",
      unitPriceKobo: toKobo(l.discount_Price ?? l.original_price),
      quantity: Math.max(1, Number(l.count) || 1),
      requiresPrescription: toBool(l.control_med),
    }));
    const subtotal = items.reduce((s: number, i: { unitPriceKobo: number; quantity: number }) => s + i.unitPriceKobo * i.quantity, 0);
    const total = toKobo(d.total) || subtotal;
    const placed = toDate(d.order_date) ?? new Date();
    const legacyStatus = str(d.Status) ?? "Unknown";
    const delivered = /deliver|complete/i.test(legacyStatus);

    const data = {
      reference: `PS-OLD-${doc.id.slice(0, 10).toUpperCase()}`,
      paystackRef: doc.id,
      profileId: profileIds.get(email) ?? null,
      email: email || "unknown@pharmastepng.com",
      customerName: str(d.owner) ?? "Unknown",
      phone: str(d.phone) ?? "",
      addressLine: str(d.addressline) ?? "",
      city: "",
      subtotalKobo: subtotal,
      deliveryFeeKobo: Math.max(0, total - subtotal),
      totalKobo: total,
      // Old orders were written after the Paystack popup reported success; treat them as paid.
      status: delivered ? ("DELIVERED" as const) : ("PROCESSING" as const),
      paidAt: placed,
      isLegacy: true,
      legacyStatus,
      createdAt: placed,
    };

    if (!dryRun) {
      const existing = await prisma.order.findUnique({ where: { firebaseId: doc.id } });
      if (existing) {
        await prisma.order.update({ where: { id: existing.id }, data: { profileId: data.profileId, legacyStatus } });
      } else {
        await prisma.order.create({ data: { ...data, firebaseId: doc.id, items: { create: items } } });
      }
    }
    if (++done % 50 === 0) console.log(`  ${done}/${snap.size}`);
  }
  console.log(`Orders: ${done} imported.`);
}

// ---------- run ----------

async function main() {
  if (dryRun) console.log("DRY RUN: nothing will be written.\n");
  if (only.includes("products")) await migrateProducts();
  if (only.includes("users")) await migrateUsers();
  if (only.includes("orders")) await migrateOrders();
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
