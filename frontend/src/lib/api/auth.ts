import { apiFetch } from "./client";

export interface ApiAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  is_default: boolean;
  created_at: string;
}

export interface ApiUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  date_of_birth: string | null;
  notify_order_updates: boolean;
  notify_promotions: boolean;
  notify_new_arrivals: boolean;
  addresses: ApiAddress[];
  created_at: string;
  is_staff: boolean;
}

interface AuthResponse {
  access: string;
  refresh: string;
  user: ApiUser;
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login/", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
}

export function register(fullName: string, email: string, password: string, confirmPassword: string) {
  return apiFetch<AuthResponse>("/auth/register/", {
    method: "POST",
    auth: false,
    body: { full_name: fullName, email, password, confirm_password: confirmPassword },
  });
}

export function fetchMe() {
  return apiFetch<ApiUser>("/auth/me/");
}

export function updateMe(data: Partial<Pick<ApiUser, "first_name" | "last_name" | "phone" | "date_of_birth" | "notify_order_updates" | "notify_promotions" | "notify_new_arrivals">>) {
  return apiFetch<ApiUser>("/auth/me/", { method: "PATCH", body: data });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<{ detail: string }>("/auth/change-password/", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

export function requestPasswordReset(email: string) {
  return apiFetch<{ detail: string }>("/auth/password-reset/", {
    method: "POST",
    auth: false,
    body: { email },
  });
}

export function confirmPasswordReset(uid: string, token: string, newPassword: string) {
  return apiFetch<{ detail: string }>("/auth/password-reset/confirm/", {
    method: "POST",
    auth: false,
    body: { uid, token, new_password: newPassword },
  });
}

export function listAddresses() {
  return apiFetch<ApiAddress[]>("/auth/addresses/");
}

export function createAddress(data: Omit<ApiAddress, "id" | "created_at">) {
  return apiFetch<ApiAddress>("/auth/addresses/", { method: "POST", body: data });
}

export function updateAddress(id: string, data: Partial<Omit<ApiAddress, "id" | "created_at">>) {
  return apiFetch<ApiAddress>(`/auth/addresses/${id}/`, { method: "PATCH", body: data });
}

export function deleteAddress(id: string) {
  return apiFetch<void>(`/auth/addresses/${id}/`, { method: "DELETE" });
}
