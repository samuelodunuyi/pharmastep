import {
  Bandage,
  Brain,
  Bug,
  CalendarHeart,
  Citrus,
  Droplet,
  Flower2,
  GlassWater,
  HeartHandshake,
  HeartPulse,
  Microscope,
  Pill,
  Pipette,
  Salad,
  Sparkles,
  Venus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Icon for each category slug. Unknown categories (e.g. ones added in admin) get a pill. */
const ICONS: Record<string, LucideIcon> = {
  antibacterial: Microscope,
  "anti-malarials": Bug,
  contraceptives: CalendarHeart,
  "cream-and-ointments": Pipette,
  antidiabetics: Droplet,
  antihypertensives: HeartPulse,
  skincare: Sparkles,
  "pain-management": Bandage,
  pessaries: Venus,
  antihistamines: Flower2,
  antiemetics: GlassWater,
  antipsychotics: Brain,
  vitamins: Citrus,
  gastrointestinal: Salad,
  "sexual-health": HeartHandshake,
};

// Soft backgrounds with a darker icon colour, cycled across categories.
const TONES = [
  "from-indigo-100 to-indigo-50 text-indigo-700",
  "from-pink-100 to-rose-50 text-pink-700",
  "from-teal-100 to-emerald-50 text-teal-700",
  "from-amber-100 to-orange-50 text-amber-700",
  "from-violet-100 to-purple-50 text-violet-700",
];

const KNOWN_SLUGS = Object.keys(ICONS);

/** Known categories cycle through the tones in order, so neighbouring tiles differ; others are hashed. */
function toneFor(slug: string) {
  const index = KNOWN_SLUGS.indexOf(slug);
  if (index >= 0) return TONES[index % TONES.length];
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

/**
 * Illustrated artwork for a category: fills its (relatively positioned) parent.
 * `compact` is just the tint and a centred icon, for small thumbnails.
 */
export function CategoryArt({ slug, compact, className }: { slug: string; compact?: boolean; className?: string }) {
  const Icon = ICONS[slug] ?? Pill;
  if (compact) {
    return (
      <div className={cn("absolute inset-0 grid place-items-center bg-gradient-to-br", toneFor(slug), className)} aria-hidden>
        <Icon className="size-1/2" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-gradient-to-br", toneFor(slug), className)} aria-hidden>
      {/* Large faded icon as a backdrop, plus a small capsule motif from the logo. */}
      <Icon className="absolute -top-4 -right-4 size-32 opacity-15 sm:size-40" strokeWidth={1.25} />
      <div className="absolute top-4 left-4 grid size-12 place-items-center rounded-2xl bg-white/80 shadow-sm backdrop-blur sm:size-14">
        <Icon className="size-6 sm:size-7" strokeWidth={1.75} />
      </div>
      <div className="absolute right-4 bottom-12 flex h-3 w-9 overflow-hidden rounded-full opacity-60">
        <span className="h-full w-1/2 bg-primary" />
        <span className="h-full w-1/2 bg-brand" />
      </div>
    </div>
  );
}
