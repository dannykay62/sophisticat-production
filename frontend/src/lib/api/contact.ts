import { apiFetch } from "./client";

export function submitContactMessage(data: { name: string; email: string; subject: string; message: string }) {
  return apiFetch<{ id: string }>("/contact/", { method: "POST", auth: false, body: data });
}

export function subscribeToNewsletter(email: string) {
  return apiFetch<{ email: string }>("/contact/newsletter/", { method: "POST", auth: false, body: { email } });
}
