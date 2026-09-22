import type { Metadata } from "next";
import { Camera, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ContactForm } from "@/components/forms/customer-forms";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us" };

const CHANNELS = [
  { icon: MessageCircle, iconClass: "text-success", title: "WhatsApp a pharmacist", detail: `${SITE.whatsappDisplay} · fastest response`, href: SITE.links.whatsapp },
  { icon: Camera, iconClass: "text-brand", title: "Instagram", detail: SITE.links.instagramHandle, href: SITE.links.instagram },
];

export default function ContactPage() {
  return (
    <div className="container-page grid gap-10 py-12 md:grid-cols-2">
      <div>
        <PageHeader
          title="Want to talk? Let’s talk."
          description="Questions about a medicine, an order or a prescription? Our pharmacists are here to help."
        />
        <div className="space-y-3">
          {CHANNELS.map(({ icon: Icon, iconClass, title, detail, href }) => (
            <a key={title} href={href} className="block">
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-3">
                  <Icon className={`size-6 ${iconClass}`} />
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted-foreground">{detail}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
      <Card className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
        <CardContent><ContactForm /></CardContent>
      </Card>
    </div>
  );
}
