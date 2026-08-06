import { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ShopExplorer from "@/components/shop/ShopExplorer";
import PromoBanner from "@/components/shop/PromoBanner";
import { getProducts, getCategories } from "@/lib/api/products";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Browse the full Sophisticat collection — jewelry, beaded bracelets, turbans, and African prints.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const categoryOptions = [
    { value: "all" as const, label: "All Products" },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  return (
    <>
      <ShopExplorer
        products={products}
        categoryOptions={categoryOptions}
        title="Shop All"
        breadcrumbSlot={<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />}
      />
      <PromoBanner />
    </>
  );
}
