import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryPlaceholder } from "@/components/product/category-placeholder";
import type { Category } from "@/generated/prisma/client";

type TileCategory = Pick<Category, "slug" | "name" | "imageUrl">;

/** Photo card with the category name underneath, like most pharmacy storefronts. */
export function CategoryTile({ category }: { category: TileCategory }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <CategoryPlaceholder />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <span className="text-sm font-semibold leading-tight sm:text-base">{category.name}</span>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
      </div>
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
