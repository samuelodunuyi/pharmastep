import Image from "next/image";
import { BadgeCheck } from "lucide-react";

/** Home page hero photo: a pharmacist, framed on a soft brand backdrop with one trust badge. */
export function HeroPhoto() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
      {/* Backdrop shape, offset behind the photo */}
      <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-brand-subtle" aria-hidden />
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-secondary">
        <Image
          src="/images/home/pharmacist.jpg"
          alt="A smiling PharmaStep pharmacist holding medicine packs"
          fill
          priority
          sizes="(min-width: 1024px) 32rem, (min-width: 768px) 45vw, 100vw"
          className="object-cover object-[50%_18%]"
        />
      </div>
      <div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-2xl bg-background px-4 py-3 shadow-lg ring-1 ring-foreground/5 sm:-left-8">
        <span className="grid size-10 place-items-center rounded-xl bg-success-subtle">
          <BadgeCheck className="size-5 text-success" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Licensed pharmacists</span>
          <span className="block text-xs text-muted-foreground">Every prescription is checked</span>
        </span>
      </div>
    </div>
  );
}
