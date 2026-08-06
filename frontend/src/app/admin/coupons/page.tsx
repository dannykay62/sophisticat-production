"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon, AdminCoupon } from "@/lib/api/admin";
import { PageHeader, Card, Button, Input, Field, Modal, Badge, Banner, EmptyState, LoadingRows } from "../components/ui";

type FormState = {
  code: string;
  discount_percent: string;
  valid_from: string;
  valid_until: string;
  usage_limit: string;
  is_active: boolean;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
}

const emptyForm: FormState = {
  code: "",
  discount_percent: "10",
  valid_from: new Date().toISOString().slice(0, 16),
  valid_until: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 16),
  usage_limit: "",
  is_active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    listCoupons()
      .then(setCoupons)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load coupons."));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(coupon: AdminCoupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discount_percent: String(coupon.discount_percent),
      valid_from: toLocalInput(coupon.valid_from),
      valid_until: toLocalInput(coupon.valid_until),
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : "",
      is_active: coupon.is_active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code,
        discount_percent: Number(form.discount_percent),
        valid_from: new Date(form.valid_from).toISOString(),
        valid_until: new Date(form.valid_until).toISOString(),
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        is_active: form.is_active,
      };
      if (editing) await updateCoupon(editing.id, payload);
      else await createCoupon(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(coupon: AdminCoupon) {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await deleteCoupon(coupon.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Create and manage discount codes for checkout."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New coupon
          </Button>
        }
      />

      {error && <Banner tone="error">{error}</Banner>}

      <Card className="overflow-x-auto p-0">
        {!coupons ? (
          <LoadingRows />
        ) : coupons.length === 0 ? (
          <EmptyState title="No coupons yet" description="Create your first discount code." />
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-stone-line text-left text-xs uppercase tracking-wide2 text-ink/40">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Valid window</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-stone-line/70 last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3 font-mono font-medium text-ink">{coupon.code}</td>
                  <td className="px-4 py-3 text-ink/70">{coupon.discount_percent}%</td>
                  <td className="px-4 py-3 text-xs text-ink/50">
                    {new Date(coupon.valid_from).toLocaleDateString()} – {new Date(coupon.valid_until).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {coupon.times_used}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : " / ∞"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={coupon.is_active ? "green" : "red"}>{coupon.is_active ? "Active" : "Disabled"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(coupon)} title="Edit" className="p-2 text-ink/50 hover:bg-ink/5 hover:text-ink">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon)}
                        title="Delete"
                        className="p-2 text-ink/30 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit coupon" : "New coupon"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Code">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
              placeholder="e.g. WELCOME15"
            />
          </Field>
          <Field label="Discount percent">
            <Input
              type="number"
              min="1"
              max="100"
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valid from">
              <Input
                type="datetime-local"
                value={form.valid_from}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                required
              />
            </Field>
            <Field label="Valid until">
              <Input
                type="datetime-local"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="Usage limit (blank = unlimited)">
            <Input
              type="number"
              min="1"
              value={form.usage_limit}
              onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create coupon"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
