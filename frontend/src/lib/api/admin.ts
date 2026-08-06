import { apiFetch, Paginated } from "./client";

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
export interface AdminStats {
  total_products: number;
  featured_products: number;
  total_orders: number;
  processing_orders: number;
  total_revenue: number;
  total_customers: number;
  unread_messages: number;
  low_stock: number;
  pending_reviews: number;
  newsletter_subscribers: number;
  revenue_series: { date: string; revenue: number; orders: number }[];
  top_products: { id: string; name: string; slug: string; units_sold: number }[];
}

export function fetchStats() {
  return apiFetch<AdminStats>("/admin/stats/");
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string;
  order: number;
  is_active: boolean;
  product_count: number;
}

export function listCategories() {
  return apiFetch<AdminCategory[]>("/admin/categories/");
}

export function createCategory(data: Partial<Omit<AdminCategory, "id" | "slug" | "product_count">>) {
  return apiFetch<AdminCategory>("/admin/categories/", { method: "POST", body: data });
}

export function updateCategory(id: string, data: Partial<Omit<AdminCategory, "id" | "slug" | "product_count">>) {
  return apiFetch<AdminCategory>(`/admin/categories/${id}/`, { method: "PATCH", body: data });
}

export function deleteCategory(id: string) {
  return apiFetch<void>(`/admin/categories/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  category_name: string;
  price: string;
  compare_at_price: string | null;
  stock_quantity: number;
  is_best_seller: boolean;
  is_new: boolean;
  is_featured: boolean;
  is_active: boolean;
  primary_image: string | null;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminProductImage {
  id: string;
  image: string;
  alt_text: string;
  order: number;
}

export interface AdminProductVariant {
  id: string;
  name: string;
  value: string;
  price_override: string | null;
  stock_quantity: number;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  category_name: string;
  description: string;
  features: string[];
  price: string;
  compare_at_price: string | null;
  stock_quantity: number;
  is_best_seller: boolean;
  is_new: boolean;
  is_featured: boolean;
  is_active: boolean;
  images: AdminProductImage[];
  variants: AdminProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  is_active?: boolean;
  featured?: boolean;
  low_stock?: boolean;
  ordering?: string;
  page?: number;
  [key: string]: unknown;
}

function toQueryString(params: Record<string, unknown> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listProducts(query: ProductQuery = {}) {
  return apiFetch<Paginated<AdminProductListItem>>(`/admin/products/${toQueryString(query)}`);
}

export function fetchProduct(id: string) {
  return apiFetch<AdminProductDetail>(`/admin/products/${id}/`);
}

export type ProductInput = Partial<
  Pick<
    AdminProductDetail,
    | "name"
    | "category"
    | "description"
    | "features"
    | "price"
    | "compare_at_price"
    | "stock_quantity"
    | "is_best_seller"
    | "is_new"
    | "is_featured"
    | "is_active"
    | "sku"
  >
>;

export function createProduct(data: ProductInput) {
  return apiFetch<AdminProductDetail>("/admin/products/", { method: "POST", body: data });
}

export function updateProduct(id: string, data: ProductInput) {
  return apiFetch<AdminProductDetail>(`/admin/products/${id}/`, { method: "PATCH", body: data });
}

export function deleteProduct(id: string) {
  return apiFetch<void>(`/admin/products/${id}/`, { method: "DELETE" });
}

export function toggleFeatured(id: string) {
  return apiFetch<AdminProductDetail>(`/admin/products/${id}/toggle_featured/`, { method: "POST" });
}

export function uploadProductImage(id: string, file: File, altText = "") {
  const form = new FormData();
  form.append("image", file);
  if (altText) form.append("alt_text", altText);
  return apiFetch<AdminProductImage>(`/admin/products/${id}/upload_image/`, { method: "POST", body: form });
}

export function deleteProductImage(productId: string, imageId: string) {
  return apiFetch<void>(`/admin/products/${productId}/images/${imageId}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export interface AdminOrderListItem {
  id: string;
  order_number: string;
  tracking_number: string;
  full_name: string;
  customer_email: string;
  status: string;
  payment_status: string;
  payment_provider: string;
  total: string;
  item_count: number;
  created_at: string;
}

export interface AdminOrderItem {
  id: string;
  product_slug: string;
  product_name: string;
  image: string | null;
  unit_price: string;
  quantity: number;
  variant_label: string;
  line_total: string;
}

export interface AdminOrderStatusEvent {
  status: string;
  note: string;
  created_at: string;
}

export interface AdminOrderDetail {
  id: string;
  order_number: string;
  tracking_number: string;
  user: string;
  status: string;
  payment_method: string;
  payment_provider: string;
  payment_status: string;
  payment_reference: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  shipping_address_display: string;
  subtotal: string;
  discount: string;
  shipping_fee: string;
  total: string;
  coupon_code: string;
  items: AdminOrderItem[];
  status_events: AdminOrderStatusEvent[];
  created_at: string;
  updated_at: string;
}

export function listOrders(query: { search?: string; status?: string; payment_status?: string; ordering?: string; page?: number } = {}) {
  return apiFetch<Paginated<AdminOrderListItem>>(`/admin/orders/${toQueryString(query)}`);
}

export function fetchOrder(id: string) {
  return apiFetch<AdminOrderDetail>(`/admin/orders/${id}/`);
}

export function updateOrderStatus(id: string, data: { status?: string; payment_status?: string; note?: string }) {
  return apiFetch<AdminOrderDetail>(`/admin/orders/${id}/update_status/`, { method: "PATCH", body: data });
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------
export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  read_time: string;
  is_published: boolean;
  published_at: string;
}

export function listBlogPosts(query: { search?: string; page?: number } = {}) {
  return apiFetch<Paginated<AdminBlogPost>>(`/admin/blog-posts/${toQueryString(query)}`);
}

export function fetchBlogPost(id: string) {
  return apiFetch<AdminBlogPost>(`/admin/blog-posts/${id}/`);
}

export type BlogPostInput = Partial<
  Pick<AdminBlogPost, "title" | "excerpt" | "content" | "category" | "read_time" | "is_published">
> & { image?: File };

function toBlogBody(data: BlogPostInput) {
  if (!data.image) return data;
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    form.append(key, value as string | Blob);
  });
  return form;
}

export function createBlogPost(data: BlogPostInput) {
  return apiFetch<AdminBlogPost>("/admin/blog-posts/", { method: "POST", body: toBlogBody(data) });
}

export function updateBlogPost(id: string, data: BlogPostInput) {
  return apiFetch<AdminBlogPost>(`/admin/blog-posts/${id}/`, { method: "PATCH", body: toBlogBody(data) });
}

export function deleteBlogPost(id: string) {
  return apiFetch<void>(`/admin/blog-posts/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export interface AdminCoupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  times_used: number;
}

export function listCoupons() {
  return apiFetch<AdminCoupon[]>("/admin/coupons/");
}

export function createCoupon(data: Partial<Omit<AdminCoupon, "id" | "times_used">>) {
  return apiFetch<AdminCoupon>("/admin/coupons/", { method: "POST", body: data });
}

export function updateCoupon(id: string, data: Partial<Omit<AdminCoupon, "id" | "times_used">>) {
  return apiFetch<AdminCoupon>(`/admin/coupons/${id}/`, { method: "PATCH", body: data });
}

export function deleteCoupon(id: string) {
  return apiFetch<void>(`/admin/coupons/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------
export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export function listMessages(query: { is_resolved?: boolean; search?: string; page?: number } = {}) {
  return apiFetch<Paginated<AdminContactMessage>>(`/admin/messages/${toQueryString(query)}`);
}

export function resolveMessage(id: string, is_resolved: boolean) {
  return apiFetch<AdminContactMessage>(`/admin/messages/${id}/`, { method: "PATCH", body: { is_resolved } });
}

export function deleteMessage(id: string) {
  return apiFetch<void>(`/admin/messages/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export interface AdminReview {
  id: string;
  product: string;
  product_name: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

export function listReviews(query: { is_approved?: boolean; page?: number } = {}) {
  return apiFetch<Paginated<AdminReview>>(`/admin/reviews/${toQueryString(query)}`);
}

export function setReviewApproved(id: string, is_approved: boolean) {
  return apiFetch<AdminReview>(`/admin/reviews/${id}/`, { method: "PATCH", body: { is_approved } });
}

export function deleteReview(id: string) {
  return apiFetch<void>(`/admin/reviews/${id}/`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export interface AdminCustomer {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  order_count: number;
}

export function listCustomers(query: { search?: string; page?: number } = {}) {
  return apiFetch<Paginated<AdminCustomer>>(`/admin/customers/${toQueryString(query)}`);
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
export interface AdminNewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

export function listNewsletter(query: { page?: number } = {}) {
  return apiFetch<Paginated<AdminNewsletterSubscriber>>(`/admin/newsletter/${toQueryString(query)}`);
}
