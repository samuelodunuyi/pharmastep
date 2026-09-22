import { Wordmark } from "@/components/brand/logo";

/** Staff sign-in pages: no shop header or footer, no links into the store. */
export default function StaffAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <div className="flex justify-center pt-12">
        <p className="flex items-center gap-2">
          <Wordmark className="text-xl" />
          <span className="text-sm text-muted-foreground">Staff</span>
        </p>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
