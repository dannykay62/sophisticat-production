"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImageOff } from "lucide-react";
import { fetchOrder, updateOrderStatus, AdminOrderDetail } from "@/lib/api/admin";
import { formatNaira } from "@/lib/utils";
import { Card, PageHeader, Button, Select, Field, Textarea, Badge, Banner, LoadingRows } from "../../components/ui";

const STATUS_OPTIONS = ["processing", "shipped", "out-for-delivery", "delivered", "cancelled"];
const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "refunded"];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    fetchOrder(params.id)
      .then((data) => {
        setOrder(data);
        setStatus(data.status);
        setPaymentStatus(data.payment_status);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load order."));
  }

  useEffect(load, [params.id]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: { status?: string; payment_status?: string; note?: string } = {};
      if (status !== order.status) payload.status = status;
      if (paymentStatus !== order.payment_status) payload.payment_status = paymentStatus;
      if (note) payload.note = note;
      const updated = await updateOrderStatus(order.id, payload);
      setOrder(updated);
      setNote("");
      setSuccess("Order updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !order) return <Banner tone="error">{error}</Banner>;
  if (!order) return <LoadingRows />;

  return (
    <div>
      <button onClick={() => router.push("/admin/orders")} className="mb-4 inline-flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </button>

      <PageHeader
        title={order.order_number}
        description={`Placed ${new Date(order.created_at).toLocaleString()} · Tracking ${order.tracking_number}`}
      />

      {error && <Banner tone="error">{error}</Banner>}
      {success && <Banner tone="success">{success}</Banner>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <p className="mb-3 text-xs uppercase tracking-wide2 text-ink/40">Items</p>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-stone-line/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-ink/5">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-4 w-4 text-ink/20" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.product_name}</p>
                    {item.variant_label && <p className="text-xs text-ink/40">{item.variant_label}</p>}
                    <p className="text-xs text-ink/40">
                      {item.quantity} × {formatNaira(Number(item.unit_price))}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-ink">{formatNaira(Number(item.line_total))}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-stone-line pt-3 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Subtotal</span>
                <span>{formatNaira(Number(order.subtotal))}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-ink/60">
                  <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                  <span>-{formatNaira(Number(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-ink/60">
                <span>Shipping</span>
                <span>{formatNaira(Number(order.shipping_fee))}</span>
              </div>
              <div className="flex justify-between pt-1 font-medium text-ink">
                <span>Total</span>
                <span>{formatNaira(Number(order.total))}</span>
              </div>
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-xs uppercase tracking-wide2 text-ink/40">Status timeline</p>
            {order.status_events.length === 0 ? (
              <p className="text-sm text-ink/40">No events yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {order.status_events.map((event, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <div>
                      <Badge tone="neutral">{event.status.replace(/-/g, " ")}</Badge>
                      {event.note && <p className="mt-1 text-ink/60">{event.note}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-ink/40">{new Date(event.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <p className="mb-3 text-xs uppercase tracking-wide2 text-ink/40">Customer</p>
            <p className="text-sm font-medium text-ink">{order.full_name}</p>
            <p className="text-sm text-ink/60">{order.email}</p>
            <p className="text-sm text-ink/60">{order.phone}</p>
            <p className="mt-3 text-sm text-ink/60">{order.shipping_address_display}</p>
          </Card>

          <Card>
            <p className="mb-3 text-xs uppercase tracking-wide2 text-ink/40">Payment</p>
            <p className="text-sm text-ink/70">
              Provider: <span className="text-ink">{order.payment_provider}</span>
            </p>
            <p className="text-sm text-ink/70">
              Method: <span className="text-ink">{order.payment_method}</span>
            </p>
            {order.payment_reference && (
              <p className="break-all text-sm text-ink/70">
                Reference: <span className="text-ink">{order.payment_reference}</span>
              </p>
            )}
          </Card>

          <Card>
            <p className="mb-3 text-xs uppercase tracking-wide2 text-ink/40">Update order</p>
            <form onSubmit={handleUpdate} className="space-y-3">
              <Field label="Fulfilment status">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/-/g, " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Payment status">
                <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                  {PAYMENT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Note (optional, added to timeline)">
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Shipped via GIG Logistics" />
              </Field>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving…" : "Update order"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
