import Link from "next/link";
import {
  Mail,
  Truck,
  RefreshCcw,
  FileText,
} from "lucide-react";
import {
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
} from "react-icons/fa6";
import Logo from "@/components/ui/Logo";

const FOOTER_LINKS = {
  Shop: [
    { label: "Jewelry", href: "/shop/jewelry" },
    { label: "Beaded Bracelets", href: "/shop/beaded-bracelets" },
    { label: "Turbans", href: "/shop/turbans" },
    { label: "Best Sellers", href: "/shop?sort=best-sellers" },
  ],
  Company: [
    { label: "About Sophisticat", href: "/about" },
    { label: "Our Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  Support: [
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Order Tracking", href: "/track-order" },
  ],
};

const SOCIAL_LINKS = [
  {
    icon: FaInstagram,
    href: "https://www.instagram.com/sophisticat_beautystudio/",
    label: "Instagram",
  },
  {
    icon: FaFacebookF,
    href: "https://facebook.com/",
    label: "Facebook",
  },
  {
    icon: FaXTwitter,
    href: "https://x.com/",
    label: "X",
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="container-luxe grid grid-cols-1 gap-12 py-16 md:grid-cols-2 lg:grid-cols-5">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Logo light />

          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/60">
            Quality jewelry, beaded bracelets, turbans, and African prints &
            designs. Thoughtfully crafted to elevate your everyday style with
            timeless elegance.
          </p>

          <div className="mt-6 flex items-center gap-4">
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-all duration-300 hover:border-gold-400 hover:bg-gold-400/10 hover:text-gold-300"
              >
                <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              </a>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <h4 className="eyebrow-on-dark mb-5">{title}</h4>

            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 transition-colors duration-300 hover:text-gold-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Policy Links */}
      <div className="hairline-dark">
        <div className="container-luxe grid grid-cols-1 gap-6 py-8 sm:grid-cols-3">
          {[
            {
              icon: Mail,
              label: "Shipping Policy",
            },
            {
              icon: RefreshCcw,
              label: "Returns & Refunds",
            },
            {
              icon: FileText,
              label: "Terms & Conditions",
            },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon
                className="h-5 w-5 text-gold-400"
                strokeWidth={1.4}
              />

              <span className="text-xs uppercase tracking-wide text-cream/70">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright */}
      <div className="hairline-dark">
        <div className="container-luxe flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream/40 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Sophisticat. All rights reserved.
          </p>

          <p className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5" />
            Carefully packaged and shipped across the United States.
          </p>
        </div>
      </div>
    </footer>
  );
}