"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  AdminCategory,
} from "@/lib/api/admin";
import {
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
  Field,
  Modal,
  Badge,
  Banner,
  EmptyState,
  LoadingRows,
} from "../components/ui";

type FormState = { name: string; description: string; order: string; is_active: boolean };
const emptyForm: FormState = { name: "", description: "", order: "0", is_active: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    listCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load categories."));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(cat: AdminCategory) {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description, order: String(cat.order), is_active: cat.is_active });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name: form.name, description: form.description, order: Number(form.order), is_active: form.is_active };
      if (editing) await updateCategory(editing.id, payload);
      else await createCategory(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: AdminCategory) {
    if (!confirm(`Delete "${cat.name}"? Products in this category will need to be reassigned first.`)) return;
    try {
      await deleteCategory(cat.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete — it may still have products assigned.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Categories power the storefront's header menu and shop filters automatically."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      {error && <Banner tone="error">{error}</Banner>}

      <Card className="overflow-x-auto p-0">
        {!categories ? (
          <LoadingRows />
        ) : categories.length === 0 ? (
          <EmptyState title="No categories yet" description="Create your first category to start organizing products." />
        ) : (
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-stone-line text-left text-xs uppercase tracking-wide2 text-ink/40">
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-stone-line/70 last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-ink/5">
                        {cat.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cat.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-ink/20" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-ink">{cat.name}</p>
                        <p className="text-xs text-ink/40">/{cat.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{cat.product_count}</td>
                  <td className="px-4 py-3 text-ink/70">{cat.order}</td>
                  <td className="px-4 py-3">
                    <Badge tone={cat.is_active ? "green" : "red"}>{cat.is_active ? "Active" : "Hidden"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(cat)} title="Edit" className="p-2 text-ink/50 hover:bg-ink/5 hover:text-ink">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit category" : "New category"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Display order">
            <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active (visible on storefront)
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create category"}
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


