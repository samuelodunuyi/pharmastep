import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Pager } from "@/components/ui/pager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/admin/search-input";
import { RxBadge } from "@/components/product/product-badges";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Products" };

const PAGE_SIZE = 50;

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  await requireStaff(true);
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const lowStock = sp.stock === "low";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ProductWhereInput = {
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { manufacturer: { contains: q, mode: "insensitive" } }] }),
    ...(lowStock && { stock: { lte: 5 }, isActive: true }),
  };
  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: lowStock ? { stock: "asc" } : { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        size="sm"
        title="Products"
        description={`${total} ${total === 1 ? "product" : "products"}`}
        actions={<Button asChild size="lg"><Link href="/admin/products/new"><Plus /> Add product</Link></Button>}
      />
      <SearchInput className="mb-4" placeholder="Search name or manufacturer" defaultValue={q}>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stock" value="low" defaultChecked={lowStock} className="size-4 accent-primary" /> Low stock only
        </label>
      </SearchInput>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                    {p.requiresPrescription && <RxBadge />}
                  </span>
                  {p.manufacturer && <span className="block text-xs text-muted-foreground">{p.manufacturer}</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{p.category?.name ?? "—"}</TableCell>
                <TableCell className="text-right">{formatNaira(p.priceKobo)}</TableCell>
                <TableCell className={cn("text-right font-medium", p.stock <= 5 && "text-destructive")}>{p.stock}</TableCell>
                <TableCell>{p.isActive ? <Badge variant="success">Live</Badge> : <Badge variant="secondary">Hidden</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pager
        page={page}
        pages={Math.ceil(total / PAGE_SIZE)}
        hrefFor={(p) => `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(lowStock && { stock: "low" }), page: String(p) })}`}
      />
    </div>
  );
}
