"use client";

import { create } from "zustand";
import { apiFetch, getAccessToken } from "@/lib/api/client";

/** Minimal product shape the cart/checkout UI actually needs — deliberately
 * lighter than the full storefront `Product` type so cart items sourced
 * from the backend's CartItemSerializer don't need extra round-trips to
 * fetch full product records. */
export interface CartProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: { id: string; url: string; alt: string; src?: string }[];
}

export interface CartLine {
  product: CartProduct;
  quantity: number;
}

interface ApiCartItem {
  id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  unit_price: string;
  image: string | null;
  quantity: number;
  variant_label: string;
  line_total: string;
}

interface ApiCart {
  id: string;
  items: ApiCartItem[];
  coupon_code: string;
  discount_percent: number;
  subtotal: string;
  discount: string;
  shipping_fee: string;
  total: string;
}

interface CartState {
  lines: CartLine[];
  couponCode: string | null;
  couponDiscount: number; // percentage
  isSyncing: boolean;
  addItem: (product: CartProduct, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  clear: () => Promise<void>;
  syncFromServer: () => Promise<void>;
  mergeGuestCartToServer: () => Promise<void>;
}

function fromApiItem(item: ApiCartItem): CartLine {
  return {
    product: {
      id: item.product_id,
      slug: item.product_slug,
      name: item.product_name,
      price: Number(item.unit_price),
      images: [{ id: item.id, url: "default", alt: item.product_name, src: item.image ?? undefined }],
    },
    quantity: item.quantity,
  };
}

// Cart items belonging to the currently authenticated user are the source
// of truth once syncFromServer() runs (call it after login/hydrate). Signed
// -out visitors get a normal local-only cart. On login, call
// mergeGuestCartToServer() *before* syncFromServer() so anything added while
// signed out gets folded into the account's server cart rather than
// discarded — see Header.tsx for where this is wired into the auth flow.
export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  couponCode: null,
  couponDiscount: 0,
  isSyncing: false,

  addItem: async (product, quantity = 1) => {
    set((state) => {
      const existing = state.lines.find((l) => l.product.id === product.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.product.id === product.id ? { ...l, quantity: l.quantity + quantity } : l
          ),
        };
      }
      return { lines: [...state.lines, { product, quantity }] };
    });

    if (getAccessToken()) {
      try {
        await apiFetch<ApiCart>("/cart/", { method: "POST", body: { product_id: product.id, quantity } });
      } catch {
        // local state is already updated optimistically; the next
        // syncFromServer() call will reconcile if this failed silently
      }
    }
  },

  removeItem: async (productId) => {
    set((state) => ({ lines: state.lines.filter((l) => l.product.id !== productId) }));
    if (getAccessToken()) {
      try {
        await apiFetch(`/cart/items/by-product/${productId}/`, { method: "DELETE" });
      } catch {
        // best effort
      }
    }
  },

  setQuantity: async (productId, quantity) => {
    set((state) => ({
      lines: state.lines.map((l) => (l.product.id === productId ? { ...l, quantity: Math.max(1, quantity) } : l)),
    }));
    if (getAccessToken()) {
      try {
        await apiFetch(`/cart/items/by-product/${productId}/`, { method: "PATCH", body: { quantity } });
      } catch {
        // best effort
      }
    }
  },

  applyCoupon: async (code) => {
    if (!getAccessToken()) return false;
    try {
      const cart = await apiFetch<ApiCart>("/cart/apply-coupon/", { method: "POST", body: { code } });
      set({ couponCode: cart.coupon_code || null, couponDiscount: cart.discount_percent });
      return true;
    } catch {
      return false;
    }
  },

  removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),

  clear: async () => {
    set({ lines: [], couponCode: null, couponDiscount: 0 });
    if (getAccessToken()) {
      try {
        await apiFetch("/cart/", { method: "DELETE" });
      } catch {
        // best effort
      }
    }
  },

  syncFromServer: async () => {
    if (!getAccessToken()) return;
    set({ isSyncing: true });
    try {
      const cart = await apiFetch<ApiCart>("/cart/");
      set({
        lines: cart.items.map(fromApiItem),
        couponCode: cart.coupon_code || null,
        couponDiscount: cart.discount_percent,
      });
    } catch {
      // keep whatever local state exists if the sync fails
    } finally {
      set({ isSyncing: false });
    }
  },

  mergeGuestCartToServer: async () => {
    if (!getAccessToken()) return;
    const guestLines = get().lines;
    if (guestLines.length === 0) return;

    // Sequential, not Promise.all: the backend increments quantity when the
    // same product is posted twice, so concurrent requests for the same
    // product could race. Sequential POSTs keep the merge deterministic.
    for (const line of guestLines) {
      try {
        await apiFetch<ApiCart>("/cart/", {
          method: "POST",
          body: { product_id: line.product.id, quantity: line.quantity },
        });
      } catch {
        // best effort — a failed line item shouldn't block the rest of the merge
      }
    }
  },
}));

export function getCartTotals(lines: CartLine[], couponDiscount: number) {
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const discount = Math.round(subtotal * (couponDiscount / 100));
  const shipping = subtotal > 0 ? (subtotal >= 100000 ? 0 : 4990) : 0;
  const total = subtotal - discount + shipping;
  return { subtotal, discount, shipping, total };
}
