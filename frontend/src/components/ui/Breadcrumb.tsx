import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink/50">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-gold-500 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink/70">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
