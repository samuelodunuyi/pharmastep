import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold tracking-tight text-primary", className)}>
      Pharma<span className="text-brand">Step</span>
    </span>
  );
}

export function Logo({ showMark = true, suffix, className }: { showMark?: boolean; suffix?: React.ReactNode; className?: string }) {
  return (
    <Link href="/" className={cn("flex shrink-0 items-center gap-2", className)} aria-label="PharmaStep home">
      {showMark && <Image src="/pslogo.jpg" alt="" width={36} height={36} className="rounded-md" priority />}
      <Wordmark className="text-lg" />
      {suffix}
    </Link>
  );
}
