"use client";

import { create } from "zustand";
import { apiFetch, getAccessToken } from "@/lib/api/client";
import { ApiProductListItem, normalizeListItem } from "@/lib/api/products";
import { Product } from "@/types";

interface ApiWishlistItem {
  id: string;
  product: ApiProductListItem;
  added_at: string;
}

interface WishlistState {
  items: Product[];
  isSyncing: boolean;
  toggle: (product: Product) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  syncFromServer: () => Promise<void>;
}

// Guest (signed-out) visitors get a local-only wishlist that resets on
// reload. Once authenticated, syncFromServer() makes the backend the
// source of truth — see cartStore.ts for the matching pattern.
export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isSyncing: false,

  toggle: async (product) => {
    const exists = get().items.some((p) => p.id === product.id);

    set((state) => ({
      items: exists ? state.items.filter((p) => p.id !== product.id) : [...state.items, product],
    }));

    if (!getAccessToken()) return;

    try {
      if (exists) {
        await apiFetch(`/wishlist/by-product/${product.id}/`, { method: "DELETE" });
      } else {
        await apiFetch("/wishlist/", { method: "POST", body: { product_id: product.id } });
      }
    } catch {
      // local state already updated optimistically; next syncFromServer() reconciles
    }
  },

  remove: async (productId) => {
    set((state) => ({ items: state.items.filter((p) => p.id !== productId) }));
    if (!getAccessToken()) return;
    try {
      await apiFetch(`/wishlist/by-product/${productId}/`, { method: "DELETE" });
    } catch {
      // best effort
    }
  },

  has: (productId) => get().items.some((p) => p.id === productId),

  syncFromServer: async () => {
    if (!getAccessToken()) return;
    set({ isSyncing: true });
    try {
      const items = await apiFetch<ApiWishlistItem[]>("/wishlist/");
      set({ items: items.map((i) => normalizeListItem(i.product)) });
    } catch {
      // keep whatever local state exists if the sync fails
    } finally {
      set({ isSyncing: false });
    }
  },
}));
