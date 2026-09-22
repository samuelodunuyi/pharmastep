import { cn } from "@/lib/utils";

/** Full-height centred message: used by the 404, error and setup pages. */
export function CenteredMessage({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Extra content below the description, e.g. a checklist. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center", className)}>
      {eyebrow && <p className="text-sm font-semibold text-brand">{eyebrow}</p>}
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary">{title}</h1>
      {description && <p className="mt-2 max-w-md text-muted-foreground">{description}</p>}
      {children && <div className="mt-6 w-full max-w-xl text-left">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
