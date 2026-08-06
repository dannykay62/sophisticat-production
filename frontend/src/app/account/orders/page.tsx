"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import * as ordersApi from "@/lib/api/orders";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  processing: "bg-gold-50 text-gold-600",
  shipped: "bg-blue-50 text-blue-600",
  "out-for-delivery": "bg-orange-50 text-orange-600",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  processing: "Processing",
  shipped: "Shipped",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatNairaFromString(value: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(
    Number(value)
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<ordersApi.ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    ordersApi
      .listMyOrders()
      .then(setOrders)
      .catch(() => setError("Couldn't load your orders. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-display-md text-ink">My Orders</h1>
      <p className="mt-2 text-sm text-ink/55">Track and review your order history.</p>

      {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-ink/50">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="font-display text-xl text-ink">You haven&apos;t placed any orders yet</p>
          <Link href="/shop" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="border border-stone-line p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-line pb-4">
                <div>
                  <p className="text-sm text-ink">{order.order_number}</p>
                  <p className="text-xs text-ink/45">Placed on {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <span className={cn("px-3 py-1 text-[11px] uppercase tracking-wide2", STATUS_STYLES[order.status])}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-12">
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

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-line pt-4">
                <span className="font-display text-lg text-ink">Total: {formatNairaFromString(order.total)}</span>
                <div className="flex gap-3">
                  <Link href={`/track-order?order=${order.order_number}`} className="btn-outline-dark px-5 py-2.5 text-xs">
                    Track Order
                  </Link>
                  {order.items[0] && (
                    <Link href={`/product/${order.items[0].product_slug}`} className="link-underline text-xs uppercase tracking-wide2 text-ink self-center">
                      Buy Again
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
