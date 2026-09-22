import type { LucideIcon } from "lucide-react";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Draw a dashed border (for use inside page content rather than a full page). */
  bordered?: boolean;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, bordered, className }: EmptyStateProps) {
  return (
    <Empty className={cn(bordered && "border py-12", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-12 rounded-xl">
          <Icon className="size-6" />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
