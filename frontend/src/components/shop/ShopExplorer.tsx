"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Star } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { Product, ProductCategory } from "@/types";
import { formatNaira, cn } from "@/lib/utils";

const PAGE_SIZE = 8;

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "best-sellers", label: "Best Sellers" },
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

const MAX_PRICE = 200000;

interface CategoryOption {
  value: ProductCategory | "all";
  label: string;
}

export default function ShopExplorer({
  products,
  categoryOptions,
  title,
  breadcrumbSlot,
  initialCategory = "all",
}: {
  products: Product[];
  categoryOptions: CategoryOption[];
  title: string;
  breadcrumbSlot?: React.ReactNode;
  initialCategory?: ProductCategory | "all";
}) {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">(initialCategory);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.price <= maxPrice && p.rating >= minRating);
    if (activeCategory !== "all") {
      list = list.filter((p) => p.category === activeCategory);
    }

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "best-sellers":
        list = [...list].sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller));
        break;
      default:
        break;
    }
    return list;
  }, [products, activeCategory, maxPrice, minRating, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  const filters = (
    <div className="space-y-10">
      <div>
        <h3 className="eyebrow mb-4">Categories</h3>
        <ul className="space-y-2.5">
          {categoryOptions.map((c) => (
            <li key={c.value}>
              <button
                onClick={() => updateFilter(() => setActiveCategory(c.value))}
                className={cn(
                  "text-sm transition-colors",
                  activeCategory === c.value ? "text-gold-500 font-medium" : "text-ink/60 hover:text-ink"
                )}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="eyebrow mb-4">Price Range</h3>
        <input
          type="range"
          min={10000}
          max={MAX_PRICE}
          step={5000}
          value={maxPrice}
          onChange={(e) => updateFilter(() => setMaxPrice(Number(e.target.value)))}
          className="w-full accent-gold-400"
          aria-label="Maximum price"
        />
        <div className="mt-2 flex justify-between text-xs text-ink/50">
          <span>&#8358;0</span>
          <span>{formatNaira(maxPrice)}</span>
        </div>
      </div>

      <div>
        <h3 className="eyebrow mb-4">Rating</h3>
        <ul className="space-y-2.5">
          {[4, 3, 2, 1].map((r) => (
            <li key={r}>
              <button
                onClick={() => updateFilter(() => setMinRating(minRating === r ? 0 : r))}
                className={cn(
                  "flex items-center gap-1.5 text-sm transition-colors",
                  minRating === r ? "text-gold-500" : "text-ink/60 hover:text-ink"
                )}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-3.5 w-3.5", i < r ? "fill-gold-400 text-gold-400" : "text-stone-line")} />
                ))}
                <span className="ml-1">&amp; Up</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {(activeCategory !== "all" || maxPrice < MAX_PRICE || minRating > 0) && (
        <button
          onClick={() =>
            updateFilter(() => {
              setActiveCategory("all");
              setMaxPrice(MAX_PRICE);
              setMinRating(0);
            })
          }
          className="link-underline text-xs uppercase tracking-wide2 text-ink/60"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe">
        <div className="mb-8">
          {breadcrumbSlot}
          <h1 className="mt-3 text-display-lg text-ink">{title}</h1>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">{filters}</aside>

          <div>
            <div className="mb-6 flex items-center justify-between border-b border-stone-line pb-5">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 text-xs uppercase tracking-wide2 text-ink lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <p className="hidden text-xs text-ink/50 lg:block">
                {filtered.length} {filtered.length === 1 ? "product" : "products"}
              </p>
              <label className="flex items-center gap-2 text-xs uppercase tracking-wide2 text-ink">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-stone-line bg-cream px-3 py-2 text-xs uppercase tracking-wide2 text-ink focus:border-gold-400"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <p className="font-display text-2xl text-ink">No products match those filters</p>
                <p className="text-sm text-ink/50">Try widening your price range or clearing a filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                {paginated.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center border border-stone-line text-ink transition-colors hover:border-gold-400 disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center border text-xs transition-colors",
                      currentPage === i + 1
                        ? "border-gold-400 bg-gold-400 text-ink"
                        : "border-stone-line text-ink hover:border-gold-400"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center border border-stone-line text-ink transition-colors hover:border-gold-400 disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-cream p-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5 text-ink" />
              </button>
            </div>
            {filters}
            <button onClick={() => setMobileFiltersOpen(false)} className="btn-primary mt-10 w-full">
              Show {filtered.length} Results
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
