import { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getCategories } from "@/lib/api/products";
import FeaturedCollectionsGrid from "@/components/home/FeaturedCollectionsGrid";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore every Sophisticat collection — jewelry, bracelets, turbans, and prints.",
};

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await getCategories();

  return (
    <section className="bg-cream py-10 md:py-16">
      <div className="container-luxe">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
        <h1 className="mt-3 text-display-lg text-ink">All Collections</h1>
        <p className="mt-3 max-w-md text-sm text-ink/55">
          Every Sophisticat category, curated for you to explore at your own pace.
        </p>

        <div className="mt-12">
          {collections.length === 0 ? (
            <p className="text-sm text-ink/50">No collections available right now.</p>
          ) : (
            <FeaturedCollectionsGrid collections={collections} />
          )}
        </div>
      </div>
    </section>
  );
}
