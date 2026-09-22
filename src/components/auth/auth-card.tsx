import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Centred card used by every sign-in / sign-up / password page. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="container-page flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md">
        <Card className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && <p className="mt-4 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}
