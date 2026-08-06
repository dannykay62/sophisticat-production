import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";

export default function PromoBanner({
  title = "Luxury is in the details.",
  subtitle = "Quality is in our promise.",
  ctaLabel = "Shop Collection",
  ctaHref = "/shop",
  imageKey = "rings",
}: {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageKey?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-ink">
      <ProductImage imageKey={imageKey} src="/images/products.png" alt="Sophisticat Jewelries, TUrbans, and Prints" ratio="aspect-[21/9]" className="opacity-70" />
      <div className="absolute inset-0 flex items-center">
        <div className="container-luxe">
          <h2 className="max-w-md text-display-md text-cream">
            {title}
            <br />
            {subtitle}
          </h2>
          <Link href={ctaHref} className="btn-primary mt-8 inline-flex">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
