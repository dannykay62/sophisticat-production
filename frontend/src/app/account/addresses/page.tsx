"use client";

import { useEffect, useState } from "react";
import { MapPin, Star, Trash2, Plus } from "lucide-react";
import * as authApi from "@/lib/api/auth";
import { cn } from "@/lib/utils";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<authApi.ApiAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "", full_name: "", phone: "", street: "", city: "", state: "" });

  useEffect(() => {
    authApi
      .listAddresses()
      .then(setAddresses)
      .catch(() => setError("Couldn't load your addresses. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(id: string) {
    const prev = addresses;
    setAddresses((p) => p.filter((a) => a.id !== id));
    try {
      await authApi.deleteAddress(id);
    } catch {
      setAddresses(prev);
      setError("Couldn't remove that address. Please try again.");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await authApi.updateAddress(id, { is_default: true });
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    } catch {
      setError("Couldn't update your default address. Please try again.");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label || !form.full_name || !form.street) return;
    setSaving(true);
    try {
      const created = await authApi.createAddress({ ...form, is_default: addresses.length === 0 });
      setAddresses((prev) => [...prev, created]);
      setForm({ label: "", full_name: "", phone: "", street: "", city: "", state: "" });
      setShowForm(false);
    } catch {
      setError("Couldn't save that address. Please check the form and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-display-md text-ink">My Addresses</h1>
          <p className="mt-2 text-sm text-ink/55">Manage your saved delivery addresses.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Address
        </button>
      </div>

      {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleAdd} className="mt-8 grid grid-cols-1 gap-4 border border-stone-line bg-cream-deep p-6 sm:grid-cols-2">
          <input required placeholder="Label (e.g. Home)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input-luxe" />
          <input required placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-luxe" />
          <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-luxe" />
          <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input-luxe" />
          <input required placeholder="Street Address" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="input-luxe sm:col-span-2" />
          <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-luxe sm:col-span-2" />
          <button type="submit" disabled={saving} className="btn-primary sm:col-span-2 disabled:opacity-50">
            {saving ? "Saving..." : "Save Address"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-ink/50">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <p className="mt-8 text-sm text-ink/50">You haven&apos;t saved any addresses yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className={cn("border p-6", addr.is_default ? "border-gold-400" : "border-stone-line")}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gold-500" />
                  <p className="text-sm font-medium text-ink">{addr.label}</p>
                  {addr.is_default && (
                    <span className="flex items-center gap-1 bg-gold-400/15 px-2 py-0.5 text-[10px] uppercase tracking-wide2 text-gold-600">
                      <Star className="h-2.5 w-2.5 fill-gold-500 text-gold-500" /> Default
                    </span>
                  )}
                </div>
                <button onClick={() => handleRemove(addr.id)} aria-label="Remove address" className="text-ink/40 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-ink/70">{addr.full_name}</p>
              <p className="text-sm text-ink/55">{addr.street}, {addr.city}</p>
              <p className="text-sm text-ink/55">{addr.state}</p>
              <p className="mt-1 text-sm text-ink/55">{addr.phone}</p>
              {!addr.is_default && (
                <button onClick={() => handleSetDefault(addr.id)} className="link-underline mt-3 text-xs uppercase tracking-wide2 text-ink/60">
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
