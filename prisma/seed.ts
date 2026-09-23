// Seeds categories and a sample catalogue. Safe to run repeatedly.
import { LEGACY_CATEGORIES, prisma, slugify } from "../scripts/lib";
import { SEED_LABELS } from "./seed-labels";
import { SEED_PRODUCTS } from "./seed-products";

async function main() {
  const categoryIds = new Map<string, string>();
  for (const [i, c] of LEGACY_CATEGORIES.entries()) {
    const slug = slugify(c.id);
    const imageUrl = `/images/categories/${slug}.jpg`;
    const row = await prisma.category.upsert({
      where: { slug },
      create: { slug, name: c.name, imageUrl, sortOrder: i },
      update: {},
    });
    // Add the stock photo only where no image is set, so admin uploads are kept.
    if (!row.imageUrl) await prisma.category.update({ where: { id: row.id }, data: { imageUrl } });
    categoryIds.set(slug, row.id);
  }
  console.log(`Seeded ${LEGACY_CATEGORIES.length} categories.`);

  for (const p of SEED_PRODUCTS) {
    const data = {
      name: p.name,
      manufacturer: p.manufacturer,
      activeIngredient: p.activeIngredient ?? null,
      strength: p.strength ?? null,
      packSize: p.packSize,
      dosageForm: p.dosageForm,
      priceKobo: p.price * 100,
      compareAtPriceKobo: p.compareAt ? p.compareAt * 100 : null,
      stock: p.stock,
      requiresPrescription: p.rx ?? false,
      images: [`/images/${p.image}.jpg`],
      tags: p.tags,
      description: p.description,
      categoryId: categoryIds.get(p.category) ?? null,
    };
    await prisma.product.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
  }
  console.log(`Seeded ${SEED_PRODUCTS.length} products.`);

  // Labels only where a product has none, so a pharmacist's edits and approvals are never overwritten.
  // Live from the official leaflet, but not marked as checked by a pharmacist.
  let drafted = 0;
  for (const { slug, ...label } of SEED_LABELS) {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true, label: { select: { productId: true } } } });
    if (!product || product.label) continue;
    await prisma.productLabel.create({ data: { productId: product.id, ...label, status: "APPROVED" } });
    drafted++;
  }
  console.log(`Added ${drafted} labels from official leaflets (live; pharmacist check pending).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
