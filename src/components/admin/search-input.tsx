import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

/** GET search box for admin lists. `hidden` keeps other query params (e.g. the active filter). */
export function SearchInput({
  placeholder,
  defaultValue,
  hidden,
  children,
  className,
}: {
  placeholder: string;
  defaultValue?: string;
  hidden?: Record<string, string>;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <form role="search" className={cn("flex flex-wrap items-center gap-2", className)}>
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <InputGroup className="h-9 w-72 bg-background">
        <InputGroupAddon><Search /></InputGroupAddon>
        <InputGroupInput name="q" defaultValue={defaultValue} placeholder={placeholder} aria-label="Search" />
      </InputGroup>
      {children}
      <Button type="submit" variant="outline" size="lg">Search</Button>
    </form>
  );
}
