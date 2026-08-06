"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";
import ProductImage from "@/components/ui/ProductImage";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { getCategories } from "@/lib/api/products";
import type { Collection } from "@/types";

const NAV_LINKS = [
  { label: "Shop", href: "/shop", mega: true },
  { label: "Collections", href: "/collections", mega: false },
  { label: "About", href: "/about", mega: false },
  { label: "Blog", href: "/blog", mega: false },
  { label: "Contact", href: "/contact", mega: false },
];

export default function Header() {
  const [solid, setSolid] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Collection[]>([]);

  const authStatus = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const lines = useCartStore((s) => s.lines);
  const syncFromServer = useCartStore((s) => s.syncFromServer);
  const mergeGuestCartToServer = useCartStore((s) => s.mergeGuestCartToServer);
  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  // Scroll state for the translucent -> solid header transition.
  useEffect(() => {
    function onScroll() {
      setSolid(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Categories drive the mega menu — same data source as /shop's filters.
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Resolve auth once on mount so header state (account icon) is correct
  // even on a hard refresh, not just after an in-app login.
  useEffect(() => {
    if (authStatus === "idle") hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On login, fold whatever was in the guest-session cart into the
  // account's server cart, then pull the merged cart down — see the note
  // in cartStore.ts's header comment for why this lives here rather than
  // in the login form itself (every page mounts Header, so it always runs).
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    (async () => {
      try {
        await mergeGuestCartToServer();
        await syncFromServer();
      } catch {
        // Non-fatal — the cart badge just won't reflect the merge; the
        // cart page itself retries syncFromServer() on mount.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  return (
    <header
  className={cn(
    "sticky top-0 z-50 w-full transition-all duration-500 ease-luxury",
    solid
      ? "bg-ink/92 backdrop-blur-xl border-b border-white/5 shadow-soft"
      : "bg-transparent"
  )}
>
  <div className="container-luxe flex h-24 items-center justify-between">
    <Logo light />

    {/* Desktop Navigation */}
    <nav
      className="hidden lg:flex items-center gap-10"
      onMouseLeave={() => setMegaOpen(false)}
    >
      {NAV_LINKS.map((link) => (
        <div
          key={link.href}
          className="relative"
          onMouseEnter={() => link.mega && setMegaOpen(true)}
        >
          <Link
            href={link.href}
            className="group relative flex items-center gap-1 text-[13px] font-medium uppercase tracking-[0.08em] text-cream/90 transition-colors duration-300 hover:text-gold-300"
          >
            {link.label}
            {link.mega && <ChevronDown className="h-3.5 w-3.5" />}

            {/* Luxury underline */}
            <span className="absolute -bottom-2 left-1/2 h-px w-0 -translate-x-1/2 bg-gold-300 transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>
      ))}
    </nav>

    {/* Actions */}
    <div className="flex items-center gap-6 text-cream">
      <button
        aria-label="Search"
        className="transition-colors duration-300 hover:text-gold-300"
      >
        <Search className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <Link
        href={authStatus === "authenticated" ? "/account" : "/login"}
        aria-label="Account"
        className="hidden sm:block transition-colors duration-300 hover:text-gold-300"
      >
        <User className="h-5 w-5" strokeWidth={1.5} />
      </Link>

      <Link
        href="/account/wishlist"
        aria-label="Wishlist"
        className="hidden sm:block transition-colors duration-300 hover:text-gold-300"
      >
        <Heart className="h-5 w-5" strokeWidth={1.5} />
      </Link>

      <Link
        href="/cart"
        aria-label="Shopping Bag"
        className="relative transition-colors duration-300 hover:text-gold-300"
      >
        <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />

        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-[10px] font-semibold text-ink">
            {cartCount}
          </span>
        )}
      </Link>

      <button
        aria-label="Toggle menu"
        className="lg:hidden transition-colors duration-300 hover:text-gold-300"
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>
    </div>
  </div>

  {/* Mega Menu */}
  <AnimatePresence>
    {megaOpen && categories.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => setMegaOpen(true)}
        onMouseLeave={() => setMegaOpen(false)}
        className="absolute left-0 top-full hidden w-full border-t border-white/5 bg-ink/94 backdrop-blur-xl lg:block"
      >
        <div
          className="container-luxe grid gap-8 py-10"
          style={{
            gridTemplateColumns: `repeat(${Math.min(
              categories.length,
              5
            )}, minmax(0,1fr))`,
          }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop/${cat.slug}`}
              className="group"
            >
              <div className="mb-4 overflow-hidden bg-ink-soft aspect-[3/4]">
                <ProductImage
                  imageKey={cat.slug}
                  src={cat.imageSrc}
                  alt={cat.name}
                  ratio="aspect-[3/4]"
                  className="transition-transform duration-700 ease-luxury group-hover:scale-105"
                />
              </div>

              <span className="text-sm text-cream/90 transition-colors group-hover:text-gold-300">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Mobile Navigation */}
  <AnimatePresence>
    {mobileOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden border-t border-white/5 bg-ink lg:hidden"
      >
        <div className="container-luxe flex flex-col gap-1 py-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-b border-white/5 py-4 text-[15px] font-medium uppercase tracking-[0.08em] text-cream/90 transition-colors hover:text-gold-300 last:border-none"
            >
              {link.label}
            </Link>
          ))}

          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop/${cat.slug}`}
              className="py-3 pl-4 text-sm text-cream/60 transition-colors hover:text-gold-300"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</header>
  );
}