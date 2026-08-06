"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink/50">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("border border-stone-line bg-white p-5 shadow-soft", className)}>{children}</div>;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const styles = {
    primary: "bg-ink text-cream hover:bg-ink-soft",
    secondary: "border border-stone-line bg-white text-ink hover:border-ink/30",
    danger: "border border-red-200 text-red-600 hover:bg-red-50",
    ghost: "text-ink/60 hover:text-ink",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full border border-stone-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-ink/40 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full border border-stone-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-ink/40 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full border border-stone-line bg-white px-3 py-2.5 text-sm text-ink focus:border-ink/40 focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide2 text-ink/50">{children}</label>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  neutral: "bg-ink/5 text-ink/60",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-600",
  gold: "bg-gold-50 text-gold-600",
  blue: "bg-sky-50 text-sky-700",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE_TONES; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium text-ink/60">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink/40">{description}</p>}
    </div>
  );
}

export function LoadingRows() {
  return (
    <div className="space-y-2 py-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 animate-pulse bg-ink/5" />
      ))}
    </div>
  );
}

export function Banner({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mb-4 border px-4 py-3 text-sm",
        tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  hasNext,
  hasPrev,
  onChange,
}: {
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  onChange: (page: number) => void;
}) {
  if (!hasNext && !hasPrev) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <Button variant="secondary" disabled={!hasPrev} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-ink/50">Page {page}</span>
      <Button variant="secondary" disabled={!hasNext} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
