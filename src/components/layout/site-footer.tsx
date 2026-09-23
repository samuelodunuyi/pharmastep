import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Wordmark } from "@/components/brand/logo";
import { OpenChatButton } from "@/components/chat/chat-provider";
import { APP_LINKS, HELP_LINKS, LEGAL_LINKS, SHOP_LINKS } from "@/components/layout/nav-links";
import { SITE } from "@/lib/site";

const COLUMNS = [
  { title: "Shop", links: SHOP_LINKS },
  {
    title: "Help",
    links: HELP_LINKS,
    extra: <OpenChatButton variant="link" className="h-auto p-0 font-normal text-muted-foreground hover:text-primary hover:no-underline">Chat with a pharmacist</OpenChatButton>,
  },
  { title: "Get the app", links: APP_LINKS },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-muted">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark className="text-lg" />
          <p className="mt-2 text-sm text-muted-foreground">
            Your trusted online pharmacy for prescription drugs, over-the-counter medicines and health products, delivered
            anywhere in Lagos.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary">{l.label}</Link>
                </li>
              ))}
              {"extra" in col && <li>{col.extra}</li>}
            </ul>
          </div>
        ))}
      </div>
      <Separator />
      <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          {LEGAL_LINKS.map((l) => (
            <span key={l.href}> · <Link href={l.href} className="hover:text-primary">{l.label}</Link></span>
          ))}
        </p>
        <p>Payments secured by Paystack. Prescription medicines are dispensed only after pharmacist review.</p>
      </div>
    </footer>
  );
}
