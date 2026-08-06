"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Heart, Truck, RefreshCcw, ShieldCheck } from "lucide-react";
import QuantitySelector from "@/components/product/QuantitySelector";
import { Product } from "@/types";
import { formatNaira, cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cartStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";

export default function ProductPurchasePanel({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.has(product.id));

  function handleAddToBag() {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        images: product.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt, src: img.src })),
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    handleAddToBag();
    router.push("/cart");
  }

  return (
    <div>
      <p className="eyebrow">
        {product.category
          .split("-")
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(" ")}
      </p>
      <h1 className="mt-3 text-display-md text-ink">{product.name}</h1>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-gold-400 text-gold-400" : "text-stone-line")}
            />
          ))}
        </div>
        <span className="text-sm text-ink/45">({product.reviewCount} reviews)</span>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="font-display text-3xl text-ink">{formatNaira(product.price)}</span>
        {product.compareAtPrice && (
          <span className="text-base text-ink/35 line-through">{formatNaira(product.compareAtPrice)}</span>
        )}
      </div>

      <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">{product.description}</p>

      <ul className="mt-6 space-y-1.5">
        {product.features.slice(0, 4).map((f) => (
          <li key={f} className="text-sm text-ink/55">
            &middot; {f}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex items-center gap-2 text-sm">
        <span className={cn("h-2 w-2 rounded-full", product.inStock ? "bg-green-600" : "bg-red-500")} />
        <span className="text-ink/60">{product.inStock ? "In stock" : "Out of stock"}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <QuantitySelector value={qty} onChange={setQty} />
        <button
          onClick={() => toggleWishlist(product)}
          aria-label="Add to wishlist"
          className={cn(
            "flex h-11 w-11 items-center justify-center border transition-colors",
            wishlisted ? "border-gold-400 text-gold-500" : "border-stone-line text-ink hover:border-gold-400"
          )}
        >
          <Heart className={cn("h-4 w-4", wishlisted && "fill-gold-400")} />
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button onClick={handleAddToBag} disabled={!product.inStock} className="btn-primary flex-1 disabled:opacity-40">
          {added ? "Added to Bag ✓" : "Add to Bag"}
        </button>
        <button onClick={handleBuyNow} disabled={!product.inStock} className="btn-outline-dark flex-1 disabled:opacity-40">
          Buy Now
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 border-t border-stone-line pt-8 sm:grid-cols-3">
        {[
          { icon: Truck, title: "Fast Lagos Delivery", subtitle: "1-3 Working Days" },
          { icon: RefreshCcw, title: "Easy Returns", subtitle: "14 Days Return" },
          { icon: ShieldCheck, title: "Secure Payments", subtitle: "100% Protected" },
        ].map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="flex items-center gap-2.5">
            <Icon className="h-5 w-5 shrink-0 text-gold-500" strokeWidth={1.3} />
            <div>
              <p className="text-xs text-ink">{title}</p>
              <p className="text-[11px] text-ink/45">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
