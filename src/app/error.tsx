"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CenteredMessage } from "@/components/ui/centered-message";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <CenteredMessage
      title="Something went wrong"
      description="Please try again. If it keeps happening, get in touch and we’ll sort it out."
      actions={
        <>
          <Button size="xl" onClick={reset}>Try again</Button>
          <Button asChild variant="outline" size="xl"><Link href="/contact">Contact us</Link></Button>
        </>
      }
    />
  );
}
