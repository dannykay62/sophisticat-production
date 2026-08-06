"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useAuthStore } from "@/lib/store/authStore";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const syncFromServer = useWishlistStore((s) => s.syncFromServer);
  const isSyncing = useWishlistStore((s) => s.isSyncing);
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    if (authStatus === "authenticated") syncFromServer();
  }, [authStatus, syncFromServer]);

  return (
    <div>
      <h1 className="text-display-md text-ink">My Wishlist</h1>
      <p className="mt-2 text-sm text-ink/55">Pieces you&apos;ve saved for later.</p>

      {isSyncing ? (
        <p className="mt-8 text-sm text-ink/50">Loading your wishlist...</p>
      ) : items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="font-display text-xl text-ink">Your wishlist is empty</p>
          <Link href="/shop" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
          {items.map((product) => (
            <div key={product.id} className="relative">
              <button
                onClick={() => remove(product.id)}
                aria-label={`Remove ${product.name} from wishlist`}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-cream shadow-soft text-ink hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
