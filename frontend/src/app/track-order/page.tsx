"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Package, Truck, Home, CheckCircle2 } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductImage from "@/components/ui/ProductImage";
import * as ordersApi from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const STEPS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "processing", label: "Order Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out-for-delivery", label: "Out for Delivery", icon: Home },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const STEP_ORDER = ["processing", "shipped", "out-for-delivery", "delivered"];

function formatNairaFromString(value: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(
    Number(value)
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") ?? "";

  const [query, setQuery] = useState(initialOrder);
  const [order, setOrder] = useState<ordersApi.ApiOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup(orderNumber: string) {
    if (!orderNumber.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const found = await ordersApi.trackOrder(orderNumber.trim());
      setOrder(found);
    } catch (err) {
      setOrder(null);
      setErrorMsg(err instanceof ApiError && err.status === 404 ? "We couldn't find an order with that number." : "Something went wrong looking up that order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialOrder) lookup(initialOrder);
  }, [initialOrder]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    lookup(query);
  }

  const currentStepIndex = order ? STEP_ORDER.indexOf(order.status) : -1;

  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Order Tracking" }]} />
        <h1 className="mt-3 text-display-lg text-ink">Track Your Order</h1>
        <p className="mt-3 max-w-md text-sm text-ink/55">
          Enter your order number to see the latest status and delivery timeline.
        </p>

        <form onSubmit={handleSearch} className="mt-8 flex max-w-md gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. LX-4A8B2C"
            className="input-luxe"
          />
          <button type="submit" disabled={loading} className="btn-primary shrink-0 px-6 disabled:opacity-50">
            <Search className="h-4 w-4" />
          </button>
        </form>
        {errorMsg && <p className="mt-3 text-sm text-red-500">{errorMsg}</p>}
        {loading && <p className="mt-3 text-sm text-ink/50">Looking up your order...</p>}

        {order && (
          <div className="mt-12 max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border border-stone-line bg-cream-deep p-6">
              <div>
                <p className="text-xs uppercase tracking-wide2 text-ink/45">Order Number</p>
                <p className="mt-1 font-display text-xl text-ink">{order.order_number}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide2 text-ink/45">Tracking Number</p>
                <p className="mt-1 font-display text-xl text-ink">{order.tracking_number}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide2 text-ink/45">Order Total</p>
                <p className="mt-1 font-display text-xl text-ink">{formatNairaFromString(order.total)}</p>
              </div>
            </div>

            {order.status === "cancelled" ? (
              <p className="mt-10 text-sm text-red-500">This order was cancelled.</p>
            ) : (
              <div className="mt-14 flex flex-col gap-0 sm:flex-row sm:items-start">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const reached = i <= currentStepIndex;
                  const isLast = i === STEPS.length - 1;
                  return (
                    <div key={step.key} className="flex flex-1 sm:flex-col sm:items-center">
                      <div className="flex flex-col items-center sm:contents">
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            reached ? "border-gold-400 bg-gold-400 text-ink" : "border-stone-line text-ink/30"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {!isLast && (
                          <span
                            className={cn(
                              "mx-3 my-1 h-0.5 flex-1 sm:mx-0 sm:my-3 sm:h-0.5 sm:w-full",
                              i < currentStepIndex ? "bg-gold-400" : "bg-stone-line"
                            )}
                          />
                        )}
                      </div>
                      <p className={cn("mt-2 flex-1 text-xs sm:mt-3 sm:text-center", reached ? "text-ink" : "text-ink/40")}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-14">
              <h2 className="eyebrow mb-4">Items in this order</h2>
              <div className="divide-y divide-stone-line border-y border-stone-line">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <div className="w-14">
                      <ProductImage imageKey={item.product_slug} alt={item.product_name} ratio="aspect-square" src={item.image} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-ink">{item.product_name}</p>
                      <p className="text-xs text-ink/45">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm text-ink/70">{formatNairaFromString(item.unit_price)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-ink/55">Delivering to: {order.shipping_address_display}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderContent />
    </Suspense>
  );
}
