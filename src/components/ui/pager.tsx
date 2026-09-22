import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Previous / next pagination. `hrefFor(page)` builds each page's URL. */
export function Pager({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 && (
        <Button asChild variant="outline" size="lg">
          <Link href={hrefFor(page - 1)}><ChevronLeft /> Previous</Link>
        </Button>
      )}
      <span className="px-3 text-sm text-muted-foreground">Page {page} of {pages}</span>
      {page < pages && (
        <Button asChild variant="outline" size="lg">
          <Link href={hrefFor(page + 1)}>Next <ChevronRight /></Link>
        </Button>
      )}
    </nav>
  );
}
