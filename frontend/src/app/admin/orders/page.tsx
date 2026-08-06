"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { listOrders, AdminOrderListItem } from "@/lib/api/admin";
import { Paginated } from "@/lib/api/client";
import { formatNaira } from "@/lib/utils";
import { PageHeader, Card, Input, Select, Badge, Banner, EmptyState, LoadingRows, Pagination } from "../components/ui";

const STATUS_TONES: Record<string, "neutral" | "green" | "red" | "gold" | "blue"> = {
  processing: "gold",
  shipped: "blue",
  "out-for-delivery": "blue",
  delivered: "green",
  cancelled: "red",
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<Paginated<AdminOrderListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const page = Number(searchParams.get("page") ?? "1");
  const status = searchParams.get("status") ?? "";
  const paymentStatus = searchParams.get("payment_status") ?? "";

  const load = useCallback(() => {
    setLoading(true);
    listOrders({ search: searchParams.get("search") ?? undefined, status: status || undefined, payment_status: paymentStatus || undefined, page })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders."))
      .finally(() => setLoading(false));
  }, [searchParams, status, paymentStatus, page]);

  useEffect(() => {
    load();
  }, [load]);

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    if (!("page" in next)) params.delete("page");
    router.push(`/admin/orders?${params.toString()}`);
  }

  return (
    <div>
      <PageHeader title="Orders" description="Track fulfilment and payment status across every order." />

      {error && <Banner tone="error">{error}</Banner>}

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <form
            className="relative flex-1 min-w-[220px]"
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ search });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <Input
              placeholder="Search order #, tracking #, customer..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <Select className="w-auto min-w-[160px]" value={status} onChange={(e) => updateParams({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out-for-delivery">Out for delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            className="w-auto min-w-[160px]"
            value={paymentStatus}
            onChange={(e) => updateParams({ payment_status: e.target.value })}
          >
            <option value="">All payment statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <LoadingRows />
        ) : !data || data.results.length === 0 ? (
          <EmptyState title="No orders found" description="Try adjusting your filters." />
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-stone-line text-left text-xs uppercase tracking-wide2 text-ink/40">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="cursor-pointer border-b border-stone-line/70 last:border-0 hover:bg-cream/40"
                >
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-ink hover:underline">
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-ink/40">
                      {order.item_count} item{order.item_count === 1 ? "" : "s"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink/80">{order.full_name}</p>
                    <p className="text-xs text-ink/40">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{formatNaira(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <Badge tone={order.payment_status === "paid" ? "green" : order.payment_status === "failed" ? "red" : "neutral"}>
                      {order.payment_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONES[order.status] ?? "neutral"}>{order.status.replace(/-/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink/50">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {data && (
        <Pagination page={page} hasNext={!!data.next} hasPrev={!!data.previous} onChange={(p) => updateParams({ page: String(p) })} />
      )}
    </div>
  );
}
