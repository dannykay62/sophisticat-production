"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  User,
  Truck,
  LogOut,
} from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/account", icon: LayoutDashboard },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Account Details", href: "/account/profile", icon: User },
  { label: "Order Tracking", href: "/track-order", icon: Truck },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (status === "idle") hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  function handleLogout() {
    logout();
    useCartStore.setState({ lines: [], couponCode: null, couponDiscount: 0 });
    router.push("/login");
  }

  if (status !== "authenticated") {
    return (
      <section className="bg-cream py-24">
        <div className="container-luxe text-center text-sm text-ink/50">Loading your account...</div>
      </section>
    );
  }

  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "My Account" }]} />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit bg-ink p-8 text-cream">
            <p className="eyebrow-on-dark">Welcome Back</p>
            <h2 className="mt-1 font-display text-2xl text-cream">{user?.full_name}</h2>

            <nav className="mt-8 space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                      active ? "bg-gold-400/15 text-gold-300" : "text-cream/70 hover:text-gold-300"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.4} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-3 border-t border-stone-lineDark px-3 pt-4 text-sm text-cream/50 transition-colors hover:text-red-400"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.4} />
                Logout
              </button>
            </nav>
          </aside>

          <div>{children}</div>
        </div>
      </div>
    </section>
  );
}
