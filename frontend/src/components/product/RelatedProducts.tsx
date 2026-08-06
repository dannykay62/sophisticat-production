import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/types";

export default function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <section className="mt-24">
      <div className="mb-10 text-center">
        <span className="eyebrow">You May Also Like</span>
        <h2 className="mt-3 text-display-md text-ink">Complete The Look</h2>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
