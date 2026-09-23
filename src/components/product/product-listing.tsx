import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Pager } from "@/components/ui/pager";
import { ProductGrid, productCardSelect } from "@/components/product/product-card";
import { ProductFilters, type FilterGroupData } from "@/components/product/product-filters";
import { SortSelect } from "@/components/product/sort-select";
import { db } from "@/lib/db";
import { OpenChatButton } from "@/components/chat/chat-provider";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 24;

export type ListingParams = {
  q?: string;
  category?: string;
  form?: string;
  rx?: string;
  sort?: string;
  page?: string;
};

const SORTS: Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput[] }> = {
  popular: { label: "Recommended", orderBy: [{ stock: "desc" }, { updatedAt: "desc" }] },
  newest: { label: "Newest", orderBy: [{ createdAt: "desc" }] },
  "price-asc": { label: "Price: low to high", orderBy: [{ priceKobo: "asc" }] },
  "price-desc": { label: "Price: high to low", orderBy: [{ priceKobo: "desc" }] },
  name: { label: "Name A–Z", orderBy: [{ name: "asc" }] },
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function normalizeParams(raw: Record<string, string | string[] | undefined>): ListingParams {
  return {
    q: one(raw.q)?.trim().slice(0, 100) || undefined,
    category: one(raw.category) || undefined,
    form: one(raw.form) || undefined,
    rx: one(raw.rx) || undefined,
    sort: one(raw.sort) || undefined,
    page: one(raw.page) || undefined,
  };
}

export async function ProductListing({ params, basePath }: { params: ListingParams; basePath: string }) {
  const page = Math.max(1, Number(params.page) || 1);
  const sortKey = SORTS[params.sort ?? ""] ? params.sort! : "popular";

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { manufacturer: { contains: params.q, mode: "insensitive" } },
      { activeIngredient: { contains: params.q, mode: "insensitive" } },
      { tags: { has: params.q.toLowerCase() } },
    ];
  }
  if (params.category) where.category = { slug: params.category };
  if (params.form) where.dosageForm = { equals: params.form, mode: "insensitive" };
  if (params.rx === "1") where.requiresPrescription = true;
  if (params.rx === "0") where.requiresPrescription = false;

  const [total, products, categories, forms] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: SORTS[sortKey].orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: productCardSelect,
    }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { slug: true, name: true } }),
    db.product.findMany({
      where: { isActive: true, dosageForm: { not: null } },
      distinct: ["dosageForm"],
      select: { dosageForm: true },
      orderBy: { dosageForm: "asc" },
    }),
  ]);

  // On /categories/[slug] the category lives in the path, not the query string.
  const lockedCategory = basePath.startsWith("/categories/");
  const queryParams = lockedCategory ? { ...params, category: undefined } : params;

  function href(overrides: Partial<ListingParams>) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...queryParams, page: undefined, ...overrides })) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  }

  const filterGroups: FilterGroupData[] = [
    ...(lockedCategory
      ? []
      : [
          {
            title: "Category",
            options: [
              { label: "All categories", href: href({ category: undefined }), active: !params.category },
              ...categories.map((c) => ({ label: c.name, href: href({ category: c.slug }), active: params.category === c.slug })),
            ],
          },
        ]),
    {
      title: "Prescription",
      options: [
        { label: "All medicines", href: href({ rx: undefined }), active: !params.rx },
        { label: "No prescription needed", href: href({ rx: "0" }), active: params.rx === "0" },
        { label: "Prescription only (Rx)", href: href({ rx: "1" }), active: params.rx === "1" },
      ],
    },
    ...(forms.length
      ? [
          {
            title: "Form",
            options: [
              { label: "Any form", href: href({ form: undefined }), active: !params.form },
              ...forms.map(({ dosageForm }) => ({
                label: dosageForm!,
                href: href({ form: dosageForm! }),
                active: params.form?.toLowerCase() === dosageForm!.toLowerCase(),
              })),
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <ProductFilters groups={filterGroups} variant="sidebar" />

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
            {params.q && <> for <span className="font-semibold text-foreground">“{params.q}”</span></>}
          </p>
          <div className="flex items-center gap-2">
            <ProductFilters groups={filterGroups} variant="sheet" />
            <SortSelect value={sortKey} options={Object.entries(SORTS).map(([value, s]) => ({ value, label: s.label }))} />
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState
            bordered
            icon={SearchX}
            title="No products found"
            description="Try a different spelling or the generic name. Can’t find your medicine? Our pharmacists can help source it."
            action={<OpenChatButton variant="brand" size="lg" />}
          />
        ) : (
          <ProductGrid products={products} />
        )}

        <Pager page={page} pages={Math.ceil(total / PAGE_SIZE)} hrefFor={(p) => href({ page: String(p) })} />
      </div>
    </div>
  );
}
