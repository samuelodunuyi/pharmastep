import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { ProfileForm } from "@/components/forms/customer-forms";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { signOutAction } from "@/app/actions/auth";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatNaira } from "@/lib/format";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage(props: PageProps<"/account">) {
  const profile = await requireProfile("/account");
  const sp = await props.searchParams;
  const orders = await db.order.findMany({
    // Hide checkouts that were abandoned before payment.
    where: { profileId: profile.id, NOT: { status: "CANCELLED", paidAt: null } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="container-page py-8">
      <PageHeader
        title={`Hello${profile.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}`}
        description={profile.email}
        actions={
          <form action={signOutAction}>
            <SubmitButton variant="outline" size="lg">Sign out</SubmitButton>
          </form>
        }
      />

      {sp.password === "updated" && <FormMessage state={{ message: "Your password has been updated." }} className="mb-6" />}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Your orders</h2>
          {orders.length === 0 ? (
            <EmptyState
              bordered
              icon={Package}
              title="No orders yet"
              description="When you place an order, you can track it here."
              action={<Button asChild size="lg"><Link href="/products">Start shopping</Link></Button>}
            />
          ) : (
            <Card className="py-0">
              <ul className="divide-y">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-accent">
                      <div>
                        <p className="font-semibold">{o.reference}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(o.createdAt)} · {o._count.items} {o._count.items === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <OrderStatusBadge status={o.status} legacyStatus={o.isLegacy ? o.legacyStatus : null} />
                        <span className="font-semibold">{formatNaira(o.totalKobo)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>Used to pre-fill checkout.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm fullName={profile.fullName ?? ""} phone={profile.phone ?? ""} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
