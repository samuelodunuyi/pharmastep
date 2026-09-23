import type { Metadata } from "next";
import { Camera, MessageCircle, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { OpenChatButton } from "@/components/chat/chat-provider";
import { ContactForm } from "@/components/forms/customer-forms";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us" };

/** Whole card is clickable: the title's link or button stretches over it. */
const STRETCH = "font-semibold after:absolute after:inset-0";

function Channel({ icon: Icon, iconClass, title, detail }: { icon: LucideIcon; iconClass: string; title: React.ReactNode; detail: string }) {
  return (
    <Card className="relative transition-colors hover:bg-accent">
      <CardContent className="flex items-center gap-3">
        <Icon className={`size-6 ${iconClass}`} />
        <div>
          {title}
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContactPage() {
  return (
    <div className="container-page grid gap-10 py-12 md:grid-cols-2">
      <div>
        <PageHeader
          title="Want to talk? Let’s talk."
          description="Questions about a medicine, an order or a prescription? Our pharmacists are here to help."
        />
        <div className="space-y-3">
          <Channel
            icon={MessageCircle}
            iconClass="text-success"
            title={<OpenChatButton variant="link" className={`h-auto p-0 text-base text-foreground hover:no-underline ${STRETCH}`}>Chat with a pharmacist</OpenChatButton>}
            detail="Right here on the site · fastest response"
          />
          <Channel
            icon={Camera}
            iconClass="text-brand"
            title={<a href={SITE.links.instagram} className={`block ${STRETCH}`}>Instagram</a>}
            detail={SITE.links.instagramHandle}
          />
        </div>
      </div>
      <Card className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
        <CardContent><ContactForm /></CardContent>
      </Card>
    </div>
  );
}
