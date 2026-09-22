import Image from "next/image";
import Link from "next/link";
import { CategoryArt } from "@/components/product/category-art";
import type { Category } from "@/generated/prisma/client";

type TileCategory = Pick<Category, "slug" | "name" | "imageUrl">;

/** Uses the admin-uploaded image when there is one, otherwise the illustrated artwork. */
export function CategoryTile({ category }: { category: TileCategory }) {
  const photo = !!category.imageUrl;
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-xl bg-secondary ring-1 ring-foreground/5 transition-shadow hover:shadow-md"
    >
      {photo ? (
        <>
          <Image
            src={category.imageUrl!}
            alt=""
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/10 to-transparent" />
        </>
      ) : (
        <CategoryArt slug={category.slug} className="transition-transform duration-300 group-hover:scale-105" />
      )}
      <span className={photo ? "relative p-3 text-sm font-semibold text-primary-foreground sm:text-base" : "relative p-3 text-sm font-semibold text-foreground sm:text-base"}>
        {category.name}
      </span>
    </Link>
  );
}

export function CategoryGrid({ categories }: { categories: (TileCategory & { id: string })[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {categories.map((c) => (
        <CategoryTile key={c.id} category={c} />
      ))}
    </div>
  );
}
