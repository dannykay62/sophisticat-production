import { apiFetch } from "./client";
import { Product, ProductCategory, Review, Collection } from "@/types";

// Build absolute URLs for media files
const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:8000";

function resolveMediaUrl(url?: string | null) {
  if (!url) return undefined;

  // If backend leaked an absolute Docker URL, rewrite it
  if (url.startsWith("http://backend:8000")) {
    return url.replace("http://backend:8000", MEDIA_BASE_URL);
  }

  // Already a valid absolute URL (production, CDN, localhost, etc.)
  if (url.startsWith("http")) {
    return url;
  }

  // Relative /media/... path
  return `${MEDIA_BASE_URL}${url}`;
}
// ---- Raw API response shapes ----

export interface ApiProductListItem {
  id: string;
  slug: string;
  name: string;
  category: string; // category slug
  price: string;
  compare_at_price: string | null;
  rating: number;
  review_count: number;
  in_stock: boolean;
  is_best_seller: boolean;
  is_new: boolean;
  primary_image: string | null;
}

interface ApiProductImage {
  id: string;
  image: string;
  alt_text: string;
  order: number;
}

interface ApiReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  is_verified_purchase: boolean;
  created_at: string;
}

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string;
}

interface ApiProductDetail {
  id: string;
  slug: string;
  name: string;
  category: ApiCategory;
  description: string;
  features: string[];
  price: string;
  compare_at_price: string | null;
  rating: number;
  review_count: number;
  in_stock: boolean;
  stock_quantity: number;
  sku: string;
  is_best_seller: boolean;
  is_new: boolean;
  images: ApiProductImage[];
  variants: unknown[];
  reviews: ApiReview[];
}

// ---- Normalizers: map API shapes onto the frontend's existing Product/Review types ----

export function normalizeListItem(item: ApiProductListItem): Product {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category as ProductCategory,
    price: Number(item.price),
    compareAtPrice: item.compare_at_price ? Number(item.compare_at_price) : undefined,
    rating: item.rating,
    reviewCount: item.review_count,
    images: [
      {
        id: "primary",
        url: item.category,
        alt: item.name,
        src: resolveMediaUrl(item.primary_image),
      },
    ],
    description: "",
    features: [],
    inStock: item.in_stock,
    isBestSeller: item.is_best_seller,
    isNew: item.is_new,
  };
}

function normalizeDetail(item: ApiProductDetail): Product {
  const images =
    item.images.length > 0
      ? item.images.map((img) => ({
          id: img.id,
          url: item.category.slug,
          alt: img.alt_text || item.name,
          src: resolveMediaUrl(img.image),
        }))
      : [{ id: "fallback", url: item.category.slug, alt: item.name, src: undefined }];

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category.slug as ProductCategory,
    price: Number(item.price),
    compareAtPrice: item.compare_at_price ? Number(item.compare_at_price) : undefined,
    rating: item.rating,
    reviewCount: item.review_count,
    images,
    description: item.description,
    features: item.features,
    inStock: item.in_stock,
    isBestSeller: item.is_best_seller,
    isNew: item.is_new,
  };
}

function normalizeReview(r: ApiReview): Review {
  return {
    id: r.id,
    author: r.author,
    rating: r.rating,
    date: new Date(r.created_at).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }),
    title: r.title,
    body: r.body,
    verified: r.is_verified_purchase,
  };
}

function normalizeCategory(c: ApiCategory): Collection {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.slug,
    imageSrc: resolveMediaUrl(c.image),
    category: c.slug as ProductCategory,
  };
}

// ---- Public functions ----

export interface ProductQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  bestSeller?: boolean;
  search?: string;
}

function buildQueryString(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.minPrice !== undefined) params.set("min_price", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("max_price", String(query.maxPrice));
  if (query.minRating !== undefined) params.set("min_rating", String(query.minRating));
  if (query.bestSeller) params.set("best_seller", "true");
  if (query.search) params.set("search", query.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  const items = await apiFetch<ApiProductListItem[]>(`/products/${buildQueryString(query)}`, {
    auth: false,
    cache: "no-store",
  });
  return items.map(normalizeListItem);
}

export async function getBestSellers(): Promise<Product[]> {
  const items = await apiFetch<ApiProductListItem[]>("/products/best_sellers/", { auth: false, cache: "no-store" });
  return items.map(normalizeListItem);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const item = await apiFetch<ApiProductDetail>(`/products/${slug}/`, { auth: false, cache: "no-store" });
    return normalizeDetail(item);
  } catch {
    return null;
  }
}

export async function getProductReviews(slug: string): Promise<Review[]> {
  const item = await apiFetch<ApiProductDetail>(`/products/${slug}/`, { auth: false, cache: "no-store" });
  return item.reviews.map(normalizeReview);
}

export async function getRelatedProducts(slug: string): Promise<Product[]> {
  const items = await apiFetch<ApiProductListItem[]>(`/products/${slug}/related/`, { auth: false, cache: "no-store" });
  return items.map(normalizeListItem);
}

export async function getCategories(): Promise<Collection[]> {
  const items = await apiFetch<ApiCategory[]>("/categories/", { auth: false, cache: "no-store" });
  return items.map(normalizeCategory);
}

export async function applyCoupon(code: string): Promise<{ code: string; discount_percent: number }> {
  return apiFetch("/coupons/apply/", { method: "POST", auth: false, body: { code } });
}
