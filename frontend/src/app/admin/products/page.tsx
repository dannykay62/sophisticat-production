"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Star, Trash2, Pencil, ImageOff } from "lucide-react";
import {
  listProducts,
  deleteProduct,
  toggleFeatured,
  listCategories,
  AdminProductListItem,
  AdminCategory,
} from "@/lib/api/admin";
import { formatNaira, cn } from "@/lib/utils";
import { Paginated } from "@/lib/api/client";
import { PageHeader, Card, Button, Input, Select, Badge, Banner, EmptyState, LoadingRows, Pagination } from "../components/ui";

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<Paginated<AdminProductListItem> | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const page = Number(searchParams.get("page") ?? "1");
  const category = searchParams.get("category") ?? "";
  const featured = searchParams.get("featured") ?? "";
  const lowStock = searchParams.get("low_stock") ?? "";

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listProducts({
      search: searchParams.get("search") ?? undefined,
      category: category || undefined,
      featured: featured === "true" ? true : undefined,
      low_stock: lowStock === "true" ? true : undefined,
      page,
    })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load products."))
      .finally(() => setLoading(false));
  }, [searchParams, category, featured, lowStock, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    if (!("page" in next)) params.delete("page");
    router.push(`/admin/products?${params.toString()}`);
  }

  async function handleToggleFeatured(product: AdminProductListItem) {
    setData((prev) =>
      prev
        ? { ...prev, results: prev.results.map((p) => (p.id === product.id ? { ...p, is_featured: !p.is_featured } : p)) }
        : prev
    );
    try {
      await toggleFeatured(product.id);
    } catch {
      load();
    }
  }

  async function handleDelete(product: AdminProductListItem) {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    try {
      await deleteProduct(product.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your catalog, pricing, stock, and which products are featured."
        action={
          <Link href="/admin/products/new">
            <Button>
              <Plus className="h-4 w-4" /> New product
            </Button>
          </Link>
        }
      />

      {error && <Banner tone="error">{error}</Banner>}

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <form
            className="relative flex-1 min-w-[200px]"
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ search });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
            <Input
              placeholder="Search by name, SKU..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <Select
            className="w-auto min-w-[160px]"
            value={category}
            onChange={(e) => updateParams({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={featured === "true"}
              onChange={(e) => updateParams({ featured: e.target.checked ? "true" : undefined })}
            />
            Featured only
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={lowStock === "true"}
              onChange={(e) => updateParams({ low_stock: e.target.checked ? "true" : undefined })}
            />
            Low stock only
          </label>
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <LoadingRows />
        ) : !data || data.results.length === 0 ? (
          <EmptyState title="No products found" description="Try adjusting your filters, or add a new product." />
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-stone-line text-left text-xs uppercase tracking-wide2 text-ink/40">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((p) => (
                <tr key={p.id} className="border-b border-stone-line/70 last:border-0 hover:bg-cream/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-ink/5">
                        {p.primary_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.primary_image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-ink/20" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-ink/40">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{p.category_name}</td>
                  <td className="px-4 py-3 text-ink/70">{formatNaira(Number(p.price))}</td>
                  <td className="px-4 py-3">
                    <span className={cn(p.stock_quantity <= 10 ? "text-red-600" : "text-ink/70")}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {!p.is_active && <Badge tone="red">Inactive</Badge>}
                      {p.is_featured && <Badge tone="gold">Featured</Badge>}
                      {p.is_best_seller && <Badge tone="neutral">Best seller</Badge>}
                      {p.is_new && <Badge tone="blue">New</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title={p.is_featured ? "Remove from featured" : "Mark as featured"}
                        onClick={() => handleToggleFeatured(p)}
                        className={cn("p-2 hover:bg-ink/5", p.is_featured ? "text-gold-500" : "text-ink/30")}
                      >
                        <Star className="h-4 w-4" fill={p.is_featured ? "currentColor" : "none"} />
                      </button>
                      <Link href={`/admin/products/${p.id}`} title="Edit" className="p-2 text-ink/50 hover:bg-ink/5 hover:text-ink">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button title="Delete" onClick={() => handleDelete(p)} className="p-2 text-ink/30 hover:bg-red-50 hover:text-red-600">
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

      {data && (
        <Pagination
          page={page}
          hasNext={!!data.next}
          hasPrev={!!data.previous}
          onChange={(p) => updateParams({ page: String(p) })}
        />
      )}
    </div>
  );
}
