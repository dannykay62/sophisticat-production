"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { verifyPayment } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const reference = searchParams.get("reference") ?? searchParams.get("trxref");
    if (!reference) {
      setError("No payment reference was provided.");
      return;
    }

    verifyPayment(reference)
      .then((order) => {
        router.replace(`/checkout/success?order=${order.order_number}`);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "We couldn't confirm your payment. If you were charged, contact us with your reference."
        );
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-12 w-12 text-red-500" strokeWidth={1.2} />
        <p className="font-display text-xl text-ink">Payment Verification Failed</p>
        <p className="max-w-sm text-sm text-ink/55">{error}</p>
        <div className="mt-4 flex gap-4">
          <Link href="/contact" className="btn-outline-dark">
            Contact Support
          </Link>
          <Link href="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-gold-500" strokeWidth={1.5} />
      <p className="font-display text-xl text-ink">Confirming your payment...</p>
      <p className="text-sm text-ink/55">Please don&apos;t close this page.</p>
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <section className="bg-cream py-24">
      <div className="container-luxe">
        <Suspense fallback={null}>
          <CallbackContent />
        </Suspense>
      </div>
    </section>
  );
}
