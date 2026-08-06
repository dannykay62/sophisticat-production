import { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ShopExplorer from "@/components/shop/ShopExplorer";
import PromoBanner from "@/components/shop/PromoBanner";
import { getProducts, getCategories } from "@/lib/api/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = await getCategories();
  const match = categories.find((c) => c.slug === category);
  return {
    title: match?.name ?? "Shop",
    description: match
      ? `Shop Sophisticat ${match.name} — quality pieces, handpicked for you.`
      : "Shop Sophisticat.",
  };
}

export default async function ShopCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const match = categories.find((c) => c.slug === category);
  if (!match) notFound();

  const categoryOptions = [
    { value: "all" as const, label: "All Products" },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  return (
    <>
      <ShopExplorer
        products={products}
        categoryOptions={categoryOptions}
        title={match.name}
        initialCategory={category}
        breadcrumbSlot={
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: match.name }]} />
        }
      />
      <PromoBanner imageKey={category} title={`${match.name}.`} subtitle="Crafted for everyday elegance." ctaHref="/shop" />
    </>
  );
}
