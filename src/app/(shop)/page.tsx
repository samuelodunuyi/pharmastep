import Link from "next/link";
import { BadgeCheck, FileText, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SearchForm } from "@/components/layout/search-form";
import { HeroArt } from "@/components/brand/hero-art";
import { CategoryGrid } from "@/components/product/category-tile";
import { ProductGrid, productCardSelect } from "@/components/product/product-card";
import { RxBadge } from "@/components/product/product-badges";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";

const TRUST_POINTS = [
  { icon: ShieldCheck, title: "Genuine medicines", text: "Sourced from licensed distributors" },
  { icon: FileText, title: "Pharmacist reviewed", text: "Every prescription is checked" },
  { icon: Truck, title: "Lagos delivery", text: "Fee calculated from your address" },
  { icon: BadgeCheck, title: "Secure payment", text: "Card, transfer and USSD via Paystack" },
];

const RX_STEPS = [
  { title: "Add to cart", text: "Add your prescribed items like any other product." },
  { title: "Upload at checkout", text: "Take a clear photo or upload a PDF of your prescription." },
  { title: "Pharmacist review", text: "We check it before dispatch. If it can’t be approved, you’re refunded in full." },
];

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 8 }),
    db.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: productCardSelect,
    }),
  ]);

  return (
    <>
      <section className="bg-gradient-to-b from-secondary to-background">
        <div className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <Badge variant="outline" className="bg-background">
              <BadgeCheck data-icon="inline-start" className="text-brand" /> Licensed pharmacy · Lagos
            </Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary sm:text-5xl">
              Healthcare at your <span className="text-brand">doorstep</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              Genuine medicines and health products, checked by our pharmacists and delivered across Lagos.
            </p>
            <SearchForm placeholder="What are you looking for?" withButton size="lg" className="mt-6 max-w-lg" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="lg"><Link href="/categories">Browse categories</Link></Button>
              <Button asChild variant="ghost" size="lg"><a href={SITE.links.whatsapp}><MessageCircle /> Ask a pharmacist</a></Button>
            </div>
          </div>
          <div className="hidden md:block">
            <HeroArt />
          </div>
        </div>
      </section>

      <section className="border-y bg-background">
        <div className="container-page grid grid-cols-2 gap-6 py-6 lg:grid-cols-4">
          {TRUST_POINTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container-page mt-14">
          <SectionHeader title="Shop by category" href="/categories" />
          <CategoryGrid categories={categories} />
        </section>
      )}

      {products.length > 0 && (
        <section className="container-page mt-14">
          <SectionHeader title="Popular right now" href="/products" linkLabel="All products" />
          <ProductGrid products={products} />
        </section>
      )}

      <section className="container-page mt-16">
        <div className="grid gap-8 rounded-2xl bg-primary p-8 text-primary-foreground md:grid-cols-[1fr_2fr] md:p-10">
          <div>
            <h2 className="text-2xl font-bold">Buying prescription medicine?</h2>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Items marked <RxBadge className="mx-0.5" /> need a valid prescription. It only takes a photo.
            </p>
          </div>
          <ol className="grid gap-6 sm:grid-cols-3">
            {RX_STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="grid size-8 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">{i + 1}</span>
                <p className="mt-3 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-primary-foreground/80">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
