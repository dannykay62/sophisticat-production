"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { motion } from "framer-motion";
import ProductImage from "@/components/ui/ProductImage";
import { Product } from "@/types";
import { formatNaira, cn } from "@/lib/utils";
import { useWishlistStore } from "@/lib/store/wishlistStore";

export default function ProductCard({ product, className }: { product: Product; className?: string }) {
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.has(product.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group", className)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden bg-cream-deep">
          <ProductImage
            imageKey={product.images[0].url}
            alt={product.images[0].alt}
            src={product.images[0].src}
            ratio="aspect-square"
            className="transition-transform duration-700 ease-luxury group-hover:scale-105"
          />
          {product.compareAtPrice && (
            <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[10px] uppercase tracking-wide2 text-gold-300">
              Sale
            </span>
          )}
          <button
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product);
            }}
            className={cn(
              "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-cream/90 shadow-soft transition-all duration-300 hover:text-gold-500",
              wishlisted ? "text-gold-500 opacity-100" : "text-ink opacity-0 group-hover:opacity-100"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", wishlisted && "fill-gold-500")} strokeWidth={1.5} />
          </button>
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-ink/90 py-2.5 text-center text-[11px] uppercase tracking-wide2 text-cream transition-transform duration-400 ease-luxury group-hover:translate-y-0">
            Quick View
          </div>
        </div>

        <div className="mt-3.5 space-y-1">
          <p className="text-sm text-ink/90">{product.name}</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.round(product.rating) ? "fill-gold-400 text-gold-400" : "fill-transparent text-stone-line"
                )}
              />
            ))}
            <span className="ml-1 text-[11px] text-ink/40">({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">{formatNaira(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-ink/35 line-through">{formatNaira(product.compareAtPrice)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
