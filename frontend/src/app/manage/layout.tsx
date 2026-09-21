"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Newspaper,
  TicketPercent,
  Mail,
  Star,
  Users,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import Logo from "@/components/ui/Logo";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/manage", icon: LayoutDashboard, exact: true },
  { label: "Products", href: "/manage/products", icon: Package },
  { label: "Categories", href: "/manage/categories", icon: Tag },
  { label: "Orders", href: "/manage/orders", icon: ShoppingBag },
  { label: "Blog", href: "/manage/blog", icon: Newspaper },
  { label: "Coupons", href: "/manage/coupons", icon: TicketPercent },
  { label: "Messages", href: "/manage/messages", icon: Mail },
  { label: "Reviews", href: "/manage/reviews", icon: Star },
  { label: "Customers", href: "/manage/customers", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (status === "idle") hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?next=/manage");
  }, [status, router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="text-sm tracking-wide2 text-cream/50">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!user?.is_staff) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
        <p className="eyebrow-on-dark">Restricted</p>
        <h1 className="font-display text-2xl text-cream">You don&apos;t have admin access</h1>
        <p className="max-w-sm text-sm text-cream/60">
          This area is for Sophisticat staff accounts only. If you believe this is a mistake, ask an
          existing admin to grant your account staff access from Django admin.
        </p>
        <Link href="/" className="mt-2 border border-gold-400/40 px-5 py-2.5 text-sm text-gold-300 hover:bg-gold-400/10">
          Back to storefront
        </Link>
      </div>
    );
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-ink">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-stone-line bg-ink px-4 py-3 lg:hidden">
        <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="text-cream">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-display text-lg text-cream">Sophisticat Admin</span>
        <span className="w-5" />
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 -translate-x-full bg-ink text-cream transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0",
            navOpen && "translate-x-0"
          )}
        >
          <div className="flex items-center justify-between px-6 py-6">
            <Logo light />
            <button onClick={() => setNavOpen(false)} aria-label="Close menu" className="text-cream/60 lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="px-6 text-[11px] uppercase tracking-wide3 text-cream/40">Store Management</p>

          <nav className="mt-4 space-y-0.5 px-3">
            {NAV_ITEMS.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                    active ? "bg-gold-400/15 text-gold-300" : "text-cream/70 hover:bg-white/5 hover:text-gold-300"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 w-full border-t border-stone-lineDark px-3 py-4">
            <div className="px-3 pb-3 text-xs text-cream/40">
              Signed in as
              <div className="truncate text-sm text-cream/80">{user.email}</div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-cream/60 hover:text-gold-300"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
              View storefront
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-cream/60 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Logout
            </button>
          </div>
        </aside>

        {navOpen && (
          <button
            aria-label="Close menu overlay"
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* Main content */}
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}


