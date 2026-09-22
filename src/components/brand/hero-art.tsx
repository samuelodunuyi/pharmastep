import { BadgeCheck, Pill, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Illustrated hero for the home page: the logo's capsule with floating order-status cards. */
export function HeroArt() {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-brand/70" aria-hidden>
      {/* Soft background shapes */}
      <div className="absolute -top-16 -right-16 size-72 rounded-full bg-brand/30 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 size-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.12)_1px,transparent_0)] [background-size:22px_22px]" />

      {/* Capsule, in the logo's navy and magenta */}
      <div className="absolute top-1/2 left-1/2 flex h-24 w-64 -translate-x-1/2 -translate-y-1/2 -rotate-[25deg] overflow-hidden rounded-full shadow-2xl ring-4 ring-white/20 motion-safe:animate-[hero-float_6s_ease-in-out_infinite]">
        <span className="h-full w-1/2 bg-white" />
        <span className="h-full w-1/2 bg-brand" />
      </div>

      {/* Scattered tablets */}
      <span className="absolute top-[18%] left-[16%] size-9 rounded-full bg-white/90 shadow-lg motion-safe:animate-[hero-float_5s_ease-in-out_infinite_0.6s]" />
      <span className="absolute right-[18%] bottom-[20%] size-7 rounded-full bg-brand/90 shadow-lg motion-safe:animate-[hero-float_7s_ease-in-out_infinite_1.2s]" />
      <span className="absolute right-[30%] top-[14%] h-5 w-10 rounded-full bg-white/70 shadow-lg motion-safe:animate-[hero-float_6.5s_ease-in-out_infinite_0.3s]" />

      {/* Floating status cards */}
      <StatusCard className="top-[10%] right-[6%] motion-safe:animate-[hero-float_6s_ease-in-out_infinite_0.8s]" icon={<BadgeCheck className="size-4 text-success" />} title="Prescription approved" text="Checked by a pharmacist" />
      <StatusCard className="bottom-[9%] left-[6%] motion-safe:animate-[hero-float_7s_ease-in-out_infinite_0.2s]" icon={<Truck className="size-4 text-brand" />} title="Out for delivery" text="Lekki · arriving today" />
      <StatusCard className="bottom-[34%] right-[5%] hidden lg:flex motion-safe:animate-[hero-float_5.5s_ease-in-out_infinite_1.5s]" icon={<Pill className="size-4 text-primary" />} title="Added to cart" text="Paracetamol 500mg" />
    </div>
  );
}

function StatusCard({ icon, title, text, className }: { icon: React.ReactNode; title: string; text: string; className?: string }) {
  return (
    <div className={cn("absolute flex items-center gap-3 rounded-xl bg-white/95 px-3.5 py-2.5 shadow-xl", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-muted">{icon}</span>
      <span className="text-left">
        <span className="block text-xs font-semibold text-foreground">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}
