import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategories } from "@/lib/api/products";
import FeaturedCollectionsGrid from "./FeaturedCollectionsGrid";

export default async function FeaturedCollections() {
  const collections = await getCategories();

  if (collections.length === 0) return null;

  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="container-luxe">
        <div className="mb-12 flex items-end justify-between">
          <div className="text-center w-full md:w-auto md:text-left">
            <span className="eyebrow">Shop By Category</span>
            <h2 className="mt-3 text-display-lg text-ink">Featured Collections</h2>
          </div>
          <Link
            href="/shop"
            className="link-underline hidden shrink-0 items-center gap-1 text-xs uppercase tracking-wide2 text-ink md:flex"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <FeaturedCollectionsGrid collections={collections} />

        <div className="mt-8 flex justify-center md:hidden">
          <Link href="/shop" className="link-underline flex items-center gap-1 text-xs uppercase tracking-wide2 text-ink">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
