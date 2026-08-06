"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Tag } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import QuantitySelector from "@/components/product/QuantitySelector";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { useCartStore, getCartTotals } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { formatNaira } from "@/lib/utils";

export default function CartPage() {
  const lines = useCartStore((s) => s.lines);
  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.couponDiscount);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const syncFromServer = useCartStore((s) => s.syncFromServer);
  const authStatus = useAuthStore((s) => s.status);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (authStatus === "authenticated") syncFromServer();
  }, [authStatus, syncFromServer]);

  const { subtotal, discount, shipping, total } = getCartTotals(lines, couponDiscount);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    if (authStatus !== "authenticated") {
      setCouponError("Sign in to apply a coupon code.");
      return;
    }
    const ok = await applyCoupon(couponInput);
    setCouponError(ok ? "" : "That code isn't valid. Try SOPHISTICAT10 or WELCOME15.");
  }

  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shopping Bag" }]} />
        <h1 className="mt-3 text-display-lg text-ink">Your Shopping Bag</h1>

        {authStatus !== "authenticated" && (
          <p className="mt-4 border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-700">
            You&apos;re shopping as a guest — items stay in this browser only.{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>{" "}
            to save your bag and use coupon codes.
          </p>
        )}

        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <p className="font-display text-2xl text-ink">Your bag is empty</p>
            <p className="text-sm text-ink/50">Discover pieces made to be worn every day.</p>
            <Link href="/shop" className="btn-primary mt-2">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
            <div>
              <div className="hidden grid-cols-[80px_1fr_120px_120px_100px_32px] gap-4 border-b border-stone-line pb-4 text-xs uppercase tracking-wide2 text-ink/45 md:grid">
                <span></span>
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span></span>
              </div>

              <ul>
                {lines.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="grid grid-cols-[80px_1fr_32px] items-center gap-4 border-b border-stone-line py-6 md:grid-cols-[80px_1fr_120px_120px_100px_32px]"
                  >
                    <Link href={`/product/${product.slug}`} className="block w-20">
                      <ProductImage imageKey={product.images[0].url} alt={product.images[0].alt} src={product.images[0].src} ratio="aspect-square" />
                    </Link>

                    <div>
                      <Link href={`/product/${product.slug}`} className="text-sm text-ink hover:text-gold-500 transition-colors">
                        {product.name}
                      </Link>
                      <p className="mt-1 text-xs text-ink/40 md:hidden">{formatNaira(product.price)}</p>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="mt-2 text-xs uppercase tracking-wide2 text-ink/40 hover:text-red-500 transition-colors md:hidden"
                      >
                        Remove
                      </button>
                    </div>

                    <span className="hidden text-sm text-ink/60 md:block">{formatNaira(product.price)}</span>

                    <div className="col-span-2 md:col-span-1">
                      <QuantitySelector value={quantity} onChange={(v) => setQuantity(product.id, v)} />
                    </div>

                    <span className="hidden text-sm font-medium text-ink md:block">
                      {formatNaira(product.price * quantity)}
                    </span>

                    <button
                      onClick={() => removeItem(product.id)}
                      aria-label={`Remove ${product.name}`}
                      className="hidden text-ink/40 transition-colors hover:text-red-500 md:block"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <Link href="/shop" className="link-underline mt-8 inline-block text-xs uppercase tracking-wide2 text-ink">
                &larr; Continue Shopping
              </Link>
            </div>

            <div className="h-fit border border-stone-line bg-cream-deep p-8">
              <h2 className="font-display text-xl text-ink">Order Summary</h2>

              <div className="mt-6">
                <label htmlFor="coupon" className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 border border-stone-line bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-gold-400"
                  />
                  <button onClick={handleApplyCoupon} className="btn-outline-dark px-4 py-2.5 text-xs">
                    Apply
                  </button>
                </div>
                {couponError && <p className="mt-2 text-xs text-red-500">{couponError}</p>}
                {couponCode && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-green-700">
                    <Tag className="h-3.5 w-3.5" /> {couponCode} applied ({couponDiscount}% off)
                    <button onClick={removeCoupon} className="ml-1 underline">
                      Remove
                    </button>
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3 border-t border-stone-line pt-6 text-sm">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span>-{formatNaira(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink/60">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatNaira(shipping)}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between border-t border-stone-line pt-4">
                <span className="font-display text-lg text-ink">Total</span>
                <span className="font-display text-lg text-ink">{formatNaira(total)}</span>
              </div>

              <button
                onClick={() => router.push(authStatus === "authenticated" ? "/checkout" : "/login?next=/checkout")}
                className="btn-primary mt-8 w-full"
              >
                {authStatus === "authenticated" ? "Proceed to Checkout" : "Sign In to Checkout"}
              </button>

              <div className="mt-6 flex items-center justify-center gap-3 text-ink/30">
                {["Visa", "Mastercard", "Paystack", "Stripe"].map((p) => (
                  <span key={p} className="border border-stone-line px-2.5 py-1 text-[10px] uppercase tracking-wide2">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
