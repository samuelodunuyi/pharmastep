"use client";

import { Button } from "@/components/ui/button";
import { CenteredMessage } from "@/components/ui/centered-message";
import { SITE } from "@/lib/site";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <CenteredMessage
      title="Something went wrong"
      description="Please try again. If it keeps happening, contact us on WhatsApp."
      actions={
        <>
          <Button size="xl" onClick={reset}>Try again</Button>
          <Button asChild variant="outline" size="xl"><a href={SITE.links.whatsapp}>WhatsApp us</a></Button>
        </>
      }
    />
  );
}
