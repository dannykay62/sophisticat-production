"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UploadCloud, ImageOff } from "lucide-react";
import {
  createProduct,
  updateProduct,
  uploadProductImage,
  deleteProductImage,
  listCategories,
  AdminCategory,
  AdminProductDetail,
  ProductInput,
} from "@/lib/api/admin";
import { Card, Field, Input, Textarea, Select, Button, Banner } from "../components/ui";

export default function ProductForm({ product }: { product?: AdminProductDetail }) {
  const router = useRouter();
  const isEdit = !!product;

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [features, setFeatures] = useState((product?.features ?? []).join("\n"));
  const [price, setPrice] = useState(product?.price ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compare_at_price ?? "");
  const [stockQuantity, setStockQuantity] = useState(String(product?.stock_quantity ?? 100));
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isBestSeller, setIsBestSeller] = useState(product?.is_best_seller ?? false);
  const [isNew, setIsNew] = useState(product?.is_new ?? false);

  const [images, setImages] = useState(product?.images ?? []);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories().then((cats) => {
      setCategories(cats);
      if (!category && cats.length > 0) setCategory((c) => c || cats[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload: ProductInput = {
      name,
      category,
      description,
      features: features.split("\n").map((f) => f.trim()).filter(Boolean),
      price,
      compare_at_price: compareAtPrice || null,
      stock_quantity: Number(stockQuantity),
      is_active: isActive,
      is_featured: isFeatured,
      is_best_seller: isBestSeller,
      is_new: isNew,
    };
    try {
      if (isEdit) {
        await updateProduct(product!.id, payload);
        router.push("/manage/products");
      } else {
        const created = await createProduct(payload);
        router.push(`/manage/products/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
  
    if (!file || !product) return;
  
    setError(null);
  
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploading(true);
  
    try {
      const img = await uploadProductImage(product.id, file);
      setImages((prev) => [...prev, img]);
      setImagePreview(null);
    } catch (err) {
      setImagePreview(null);
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!product) return;
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    try {
      await deleteProductImage(product.id, imageId);
    } catch {
      // reload not critical here
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Banner tone="error">{error}</Banner>}

      <Card className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Product name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Description">
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Feature bullet points (one per line)">
            <Textarea rows={3} value={features} onChange={(e) => setFeatures(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Field label="Price (₦)">
          <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </Field>
        <Field label="Compare-at price (₦)">
          <Input type="number" min="0" step="0.01" value={compareAtPrice ?? ""} onChange={(e) => setCompareAtPrice(e.target.value)} />
        </Field>
        <Field label="Stock quantity">
          <Input type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required />
        </Field>
        {isEdit && (
          <Field label="SKU">
            <Input value={product!.sku} disabled className="opacity-60" />
          </Field>
        )}
      </Card>

      <Card>
        <p className="mb-3 text-xs uppercase tracking-wide2 text-ink/40">Visibility &amp; badges</p>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active (visible on storefront)
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} />
            Best seller
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
            New arrival
          </label>
        </div>
      </Card>

      {isEdit && (
        <Card>
          <p className="mb-3 text-xs uppercase tracking-wide2 text-ink/40">Images</p>
          <div className="flex flex-wrap gap-3">
            {imagePreview && (
              <div className="relative h-24 w-24 overflow-hidden border border-stone-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Selected image preview"
                  className="h-full w-full object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-[10px] font-medium text-white">Uploading…</span>
                  </div>
                )}
              </div>
            )}
          
            {images.map((img) => (
              <div key={img.id} className="group relative h-24 w-24 overflow-hidden border border-stone-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image} alt={img.alt_text} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute right-1 top-1 hidden bg-white/90 p-1 text-red-600 group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-stone-line text-ink/40 hover:border-ink/30 hover:text-ink/60">
              {uploading ? <ImageOff className="h-5 w-5 animate-pulse" /> : <UploadCloud className="h-5 w-5" />}
              <span className="text-[10px]">Upload</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </Card>
      )}
      {!isEdit && (
        <p className="text-xs text-ink/40">Save the product first, then you&apos;ll be able to upload images.</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/manage/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}


