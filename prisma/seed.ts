// Seeds the category list from the old site. Safe to run repeatedly.
import { LEGACY_CATEGORIES, prisma, slugify } from "../scripts/lib";

async function main() {
  for (const [i, c] of LEGACY_CATEGORIES.entries()) {
    const slug = slugify(c.id);
    await prisma.category.upsert({
      where: { slug },
      create: { slug, name: c.name, imageUrl: `/images/${c.image}`, sortOrder: i },
      update: {},
    });
  }
  console.log(`Seeded ${LEGACY_CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
