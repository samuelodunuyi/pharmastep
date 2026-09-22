import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fills its (relatively positioned) parent. Shows a placeholder when there's no image. */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <div className="grid size-full place-items-center bg-muted text-muted-foreground/40">
        <ImageOff className="size-1/4 max-h-8 max-w-8" />
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-contain p-2", className)} />;
}
