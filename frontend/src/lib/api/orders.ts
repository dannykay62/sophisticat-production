import { apiFetch } from "./client";

export interface ApiOrderItem {
  id: string;
  product_slug: string;
  product_name: string;
  image: string | null;
  unit_price: string;
  quantity: number;
  variant_label: string;
  line_total: string;
}

export interface ApiOrderStatusEvent {
  status: string;
  note: string;
  created_at: string;
}

export interface ApiOrder {
  id: string;
  order_number: string;
  tracking_number: string;
  status: "processing" | "shipped" | "out-for-delivery" | "delivered" | "cancelled";
  payment_method: string;
  payment_status: string;
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
  items: ApiOrderItem[];
  status_events: ApiOrderStatusEvent[];
  created_at: string;
}

export interface CreateOrderPayload {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  payment_method: "card" | "transfer" | "ussd";
  coupon_code?: string;
  items: { product_id: string; quantity: number; variant_label?: string }[];
}

export function listMyOrders() {
  return apiFetch<ApiOrder[]>("/orders/");
}

export function getOrder(orderNumber: string) {
  return apiFetch<ApiOrder>(`/orders/${orderNumber}/`);
}

export function createOrder(payload: CreateOrderPayload) {
  return apiFetch<ApiOrder>("/orders/", { method: "POST", body: payload });
}

export function trackOrder(orderNumber: string) {
  return apiFetch<ApiOrder>(`/orders/track/${orderNumber}/`, { auth: false });
}

export function initializePayment(orderNumber: string, provider: "stripe" | "paystack" = "paystack") {
  return apiFetch<{ authorization_url: string; reference: string }>(
    `/orders/${orderNumber}/initialize-payment/`,
    { method: "POST", body: { provider } }
  );
}
// Flutterwave is still implemented server-side (services_flutterwave.py);
// re-enable by adding "flutterwave" to the provider union above and to the
// picker UI in checkout/page.tsx.

export function verifyPayment(reference: string) {
  return apiFetch<ApiOrder>(`/orders/verify-payment/?reference=${encodeURIComponent(reference)}`, { auth: false });
}
