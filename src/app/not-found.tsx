import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CenteredMessage } from "@/components/ui/centered-message";

export default function NotFound() {
  return (
    <CenteredMessage
      eyebrow="404"
      title="We couldn’t find that page"
      description="It may have moved, or the product is no longer available."
      actions={
        <>
          <Button asChild size="xl"><Link href="/">Go home</Link></Button>
          <Button asChild variant="outline" size="xl"><Link href="/products">Browse products</Link></Button>
        </>
      }
    />
  );
}
