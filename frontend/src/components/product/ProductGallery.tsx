"use client";

import { useState } from "react";
import ProductImage from "@/components/ui/ProductImage";
import { ProductImage as ProductImageType } from "@/types";
import { cn } from "@/lib/utils";

export default function ProductGallery({ images, productName }: { images: ProductImageType[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const current = images[active];

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      <div className="flex shrink-0 gap-3 overflow-x-auto sm:flex-col sm:overflow-visible">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1} of ${productName}`}
            className={cn(
              "h-20 w-16 shrink-0 overflow-hidden border-2 transition-colors sm:h-24 sm:w-20",
              active === i ? "border-gold-400" : "border-transparent opacity-70 hover:opacity-100"
            )}
          >
            <ProductImage imageKey={img.url} alt={img.alt} src={img.src} ratio="aspect-[4/5]" />
          </button>
        ))}
      </div>

      <div
        className="relative flex-1 cursor-zoom-in overflow-hidden bg-cream-deep"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setOrigin(`${x}% ${y}%`);
        }}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        <div
          className="transition-transform duration-300 ease-out"
          style={{ transform: zoomed ? "scale(1.6)" : "scale(1)", transformOrigin: origin }}
        >
          <ProductImage imageKey={current.url} alt={current.alt} src={current.src} ratio="aspect-[4/5]" />
        </div>
      </div>
    </div>
  );
}
