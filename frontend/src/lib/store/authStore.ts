"use client";

import { create } from "zustand";
import * as authApi from "@/lib/api/auth";
import { clearTokens, getAccessToken, setTokens } from "@/lib/api/client";

interface AuthState {
  user: authApi.ApiUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  setUser: (user: authApi.ApiUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,

  login: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      const data = await authApi.login(email, password);
      setTokens(data.access, data.refresh);
      set({ user: data.user, status: "authenticated" });
    } catch (err) {
      set({ status: "unauthenticated", error: err instanceof Error ? err.message : "Login failed" });
      throw err;
    }
  },

  register: async (fullName, email, password, confirmPassword) => {
    set({ status: "loading", error: null });
    try {
      const data = await authApi.register(fullName, email, password, confirmPassword);
      setTokens(data.access, data.refresh);
      set({ user: data.user, status: "authenticated" });
    } catch (err) {
      set({ status: "unauthenticated", error: err instanceof Error ? err.message : "Registration failed" });
      throw err;
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null, status: "unauthenticated" });
  },

  hydrate: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ status: "unauthenticated" });
      return;
    }
    set({ status: "loading" });
    try {
      const user = await authApi.fetchMe();
      set({ user, status: "authenticated" });
    } catch {
      clearTokens();
      set({ user: null, status: "unauthenticated" });
    }
  },

  setUser: (user) => set({ user }),
}));
