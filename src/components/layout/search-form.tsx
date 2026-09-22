import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

/** Product search (plain GET to /products, works without JavaScript). */
export function SearchForm({
  placeholder = "Search medicines, brands or conditions",
  defaultValue,
  withButton,
  size = "default",
  className,
}: {
  placeholder?: string;
  defaultValue?: string;
  withButton?: boolean;
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <form action="/products" role="search" className={cn("flex gap-2", className)}>
      <InputGroup className={cn("bg-background", size === "lg" ? "h-11" : "h-10")}>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} aria-label="Search products" />
      </InputGroup>
      {withButton && (
        <Button type="submit" size={size === "lg" ? "xl" : "lg"} className="shrink-0">
          Search
        </Button>
      )}
    </form>
  );
}
