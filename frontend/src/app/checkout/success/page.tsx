"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <section className="bg-cream py-24">
      <div className="container-luxe flex flex-col items-center text-center">
        <CheckCircle2 className="h-14 w-14 text-gold-500" strokeWidth={1} />
        <h1 className="mt-6 text-display-lg text-ink">Order Confirmed</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/60">
          Thank you for shopping with Sophisticat. A confirmation has been sent to
          your email, and your order is now being prepared with care.
        </p>
        {orderNumber && (
          <p className="mt-6 border border-stone-line px-6 py-3 font-display text-lg text-ink">
            Order No. {orderNumber}
          </p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href={orderNumber ? `/track-order?order=${orderNumber}` : "/track-order"} className="btn-primary">
            Track Your Order
          </Link>
          <Link href="/shop" className="btn-outline-dark">
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
