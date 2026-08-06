"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductImage from "@/components/ui/ProductImage";
import { useCartStore, getCartTotals } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { createOrder, initializePayment } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatNaira, cn } from "@/lib/utils";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  address: z.string().min(5, "Enter your delivery address"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Select your state"),
  paymentMethod: z.enum(["card", "transfer", "ussd"]),
  paymentProvider: z.enum(["stripe", "paystack"]),
});
// Flutterwave is still fully implemented server-side (services_flutterwave.py)
// but disabled here — add "flutterwave" to the paymentProvider enum above
// and to the picker options below to bring it back.

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const NIGERIAN_STATES = [
  "Lagos", "Abuja (FCT)", "Rivers", "Oyo", "Kano", "Ogun", "Enugu", "Kaduna", "Delta", "Edo",
];

export default function CheckoutPage() {
  const lines = useCartStore((s) => s.lines);
  const couponCode = useCartStore((s) => s.couponCode);
  const couponDiscount = useCartStore((s) => s.couponDiscount);
  const clear = useCartStore((s) => s.clear);
  const syncFromServer = useCartStore((s) => s.syncFromServer);
  const authStatus = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace("/login?next=/checkout");
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === "authenticated") syncFromServer();
  }, [authStatus, syncFromServer]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "card",
      paymentProvider: "paystack",
      fullName: user?.full_name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  });

  const paymentProvider = watch("paymentProvider");
  const { subtotal, discount, shipping, total } = getCartTotals(lines, couponDiscount);

  async function onSubmit(values: CheckoutFormValues) {
    setSubmitError("");
    try {
      const order = await createOrder({
        full_name: values.fullName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        city: values.city,
        state: values.state,
        payment_method: values.paymentMethod,
        coupon_code: couponCode ?? undefined,
        items: lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
      });

      try {
        const { authorization_url } = await initializePayment(order.order_number, values.paymentProvider);
        await clear();
        window.location.href = authorization_url;
        return;
      } catch {
        // The gateway isn't configured (e.g. local dev without keys) — the order
        // still exists with payment_status "pending"; let the customer through
        // to confirmation rather than blocking checkout entirely.
        await clear();
        router.push(`/checkout/success?order=${order.order_number}`);
      }
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Couldn't place your order. Please check your details and try again."
      );
    }
  }

  if (authStatus !== "authenticated") {
    return (
      <section className="bg-cream py-24">
        <div className="container-luxe text-center text-sm text-ink/50">Loading checkout...</div>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="bg-cream py-24">
        <div className="container-luxe flex flex-col items-center gap-4 text-center">
          <p className="font-display text-2xl text-ink">Your bag is empty</p>
          <button onClick={() => router.push("/shop")} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Bag", href: "/cart" }, { label: "Checkout" }]} />
        <h1 className="mt-3 text-display-lg text-ink">Secure Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            {submitError && (
              <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>
            )}

            <div>
              <h2 className="eyebrow mb-5">1. Shipping Information</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Full Name" error={errors.fullName?.message}>
                  <input {...register("fullName")} className="input-luxe" placeholder="Adaeze Okafor" />
                </Field>
                <Field label="Email Address" error={errors.email?.message}>
                  <input {...register("email")} type="email" className="input-luxe" placeholder="you@example.com" />
                </Field>
                <Field label="Phone Number" error={errors.phone?.message}>
                  <input {...register("phone")} className="input-luxe" placeholder="080X XXX XXXX" />
                </Field>
                <Field label="State" error={errors.state?.message}>
                  <select {...register("state")} className="input-luxe" defaultValue="">
                    <option value="" disabled>
                      Select state
                    </option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="City" error={errors.city?.message}>
                  <input {...register("city")} className="input-luxe" placeholder="Ikeja" />
                </Field>
                <Field label="Delivery Address" error={errors.address?.message} className="sm:col-span-2">
                  <input {...register("address")} className="input-luxe" placeholder="Street address" />
                </Field>
              </div>
            </div>

            <div>
              <h2 className="eyebrow mb-5">2. Pay With</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: "paystack" as const,
                    label: "Paystack",
                    hint: "Cards, bank transfer & USSD",
                  },
                  {
                    value: "stripe" as const,
                    label: "Stripe",
                    hint: "International cards",
                  },
                ].map(({ value, label, hint }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setValue("paymentProvider", value)}
                    className={cn(
                      "flex flex-col items-center gap-1 border p-5 text-center transition-colors",
                      paymentProvider === value ? "border-gold-400 bg-gold-50" : "border-stone-line hover:border-ink/30"
                    )}
                  >
                    <span className="text-sm font-medium text-ink">{label}</span>
                    <span className="text-xs text-ink/45">{hint}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 border border-stone-line bg-gold-50/40 p-5">
                <CreditCard className="h-5 w-5 shrink-0 text-ink" strokeWidth={1.3} />
                <p className="text-sm text-ink/70">
                  You&apos;ll be redirected to {paymentProvider === "paystack" ? "Paystack" : "Stripe"} to complete payment securely.
                </p>
              </div>
            </div>
            {/*
              The separate card/transfer/ussd payment-method picker — kept
              disabled since both Paystack's and Stripe's hosted checkout
              pages already let the customer choose their exact method
              (Paystack alone covers card, bank transfer, and USSD for
              Nigerian customers); a second picker here was redundant.
              Flutterwave is still fully implemented server-side
              (services_flutterwave.py) — add it to the provider options
              above to bring it back as a third choice.

            <div>
              <h2 className="eyebrow mb-5">3. Payment Method</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { value: "card" as const, label: "Debit Card", icon: CreditCard },
                  { value: "transfer" as const, label: "Bank Transfer", icon: Building2 },
                  { value: "ussd" as const, label: "USSD", icon: Smartphone },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setValue("paymentMethod", value)}
                    className={cn(
                      "flex flex-col items-center gap-2 border p-5 transition-colors",
                      paymentMethod === value ? "border-gold-400 bg-gold-50" : "border-stone-line hover:border-ink/30"
                    )}
                  >
                    <Icon className="h-5 w-5 text-ink" strokeWidth={1.3} />
                    <span className="text-xs uppercase tracking-wide2 text-ink">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            */}

            <div>
              <h2 className="eyebrow mb-5">3. Review &amp; Place Order</h2>
              <ul className="divide-y divide-stone-line border-y border-stone-line">
                {lines.map(({ product, quantity }) => (
                  <li key={product.id} className="flex items-center gap-4 py-4">
                    <div className="w-14">
                      <ProductImage imageKey={product.images[0].url} alt={product.images[0].alt} src={product.images[0].src} ratio="aspect-square" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-ink">{product.name}</p>
                      <p className="text-xs text-ink/45">Qty {quantity}</p>
                    </div>
                    <span className="text-sm text-ink">{formatNaira(product.price * quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="h-fit border border-stone-line bg-cream-deep p-8">
            <h2 className="font-display text-xl text-ink">Order Summary</h2>
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
            <button type="submit" disabled={isSubmitting} className="btn-primary mt-8 w-full disabled:opacity-50">
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs uppercase tracking-wide2 text-ink/50">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
