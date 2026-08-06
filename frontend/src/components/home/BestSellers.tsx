import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { getBestSellers } from "@/lib/api/products";

export default async function BestSellers() {
  const products = (await getBestSellers()).slice(0, 6);

  if (products.length === 0) return null;

  return (
    <section className="bg-cream-deep py-20 md:py-28">
      <div className="container-luxe">
        <div className="mb-12 flex items-end justify-between">
          <div className="text-center w-full md:w-auto md:text-left">
            <span className="eyebrow">Loved By Many</span>
            <h2 className="mt-3 text-display-lg text-ink">Best Sellers</h2>
          </div>
          <Link
            href="/shop?sort=best-sellers"
            className="link-underline hidden shrink-0 items-center gap-1 text-xs uppercase tracking-wide2 text-ink md:flex"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-10 flex justify-center md:hidden">
          <Link href="/shop?sort=best-sellers" className="link-underline flex items-center gap-1 text-xs uppercase tracking-wide2 text-ink">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
