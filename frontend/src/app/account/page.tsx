"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Heart, MapPin, ArrowRight } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import * as ordersApi from "@/lib/api/orders";
import * as authApi from "@/lib/api/auth";
import { useWishlistStore } from "@/lib/store/wishlistStore";
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

export default function DashboardPage() {
  const [orders, setOrders] = useState<ordersApi.ApiOrder[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const syncWishlist = useWishlistStore((s) => s.syncFromServer);

  useEffect(() => {
    syncWishlist();
    Promise.all([ordersApi.listMyOrders(), authApi.listAddresses()])
      .then(([orderData, addressData]) => {
        setOrders(orderData);
        setAddressCount(addressData.length);
      })
      .catch(() => {
        // dashboard is non-critical — an empty state is an acceptable fallback
      })
      .finally(() => setLoading(false));
  }, [syncWishlist]);

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-display-md text-ink">Dashboard</h1>
        <p className="mt-2 text-sm text-ink/55">Welcome back, here&apos;s a summary of your account.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <DashboardCard icon={Package} label="Total Orders" value={String(orders.length)} href="/account/orders" />
        <DashboardCard icon={Heart} label="Wishlist Items" value={String(wishlistCount)} href="/account/wishlist" />
        <DashboardCard icon={MapPin} label="Saved Addresses" value={String(addressCount)} href="/account/addresses" />
      </div>

      <div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Recent Orders</h2>
          <Link href="/account/orders" className="link-underline flex items-center gap-1 text-xs uppercase tracking-wide2 text-ink">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-ink/50">Loading...</p>
        ) : recentOrders.length === 0 ? (
          <p className="border-y border-stone-line py-8 text-center text-sm text-ink/50">No orders yet.</p>
        ) : (
          <div className="divide-y divide-stone-line border-y border-stone-line">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/track-order?order=${order.order_number}`}
                className="flex flex-wrap items-center justify-between gap-4 py-5 transition-colors hover:bg-cream-deep/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex w-14 -space-x-3">
                    {order.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="h-14 w-14 overflow-hidden border-2 border-cream">
                        <ProductImage imageKey={item.product_slug} alt={item.product_name} ratio="aspect-square" src={item.image} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm text-ink">{order.order_number}</p>
                    <p className="text-xs text-ink/45">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
                <span className={cn("px-3 py-1 text-[11px] uppercase tracking-wide2", STATUS_STYLES[order.status])}>
                  {STATUS_LABELS[order.status]}
                </span>
                <span className="text-sm font-medium text-ink">{formatNairaFromString(order.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-4 border border-stone-line bg-cream-deep p-6 transition-colors hover:border-gold-400">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-400/15 text-gold-600">
        <Icon className="h-5 w-5" strokeWidth={1.4} />
      </span>
      <div>
        <p className="font-display text-2xl text-ink">{value}</p>
        <p className="text-xs uppercase tracking-wide2 text-ink/50">{label}</p>
      </div>
    </Link>
  );
}
