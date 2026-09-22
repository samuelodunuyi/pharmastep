"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <Card className="relative aspect-square py-0">
        <ProductImage src={images[active]} alt={alt} sizes="(min-width: 768px) 45vw, 100vw" priority />
      </Card>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg border bg-background",
                i === active && "border-primary ring-3 ring-ring/30",
              )}
            >
              <ProductImage src={src} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
