import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";

const STATS = [
  { value: "2K+", label: "Happy Customers" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "4.9★", label: "Average Rating" },
  { value: "10K+", label: "Orders Delivered" },
];

export default function BrandStory() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="container-luxe grid grid-cols-1 items-stretch gap-0 overflow-hidden border border-stone-line lg:grid-cols-3">
        <ProductImage
          imageKey="hero"
          src="/images/silver_handchain.jpg"
          alt="Sophisticat model wearing jewelry and a turban"
          ratio="aspect-[3/4] lg:aspect-auto"
        />

        <div className="flex flex-col justify-center px-8 py-14 sm:px-14">
          <span className="eyebrow">Our Story</span>
          <h2 className="mt-4 text-display-md text-ink">About Sophisticat</h2>
          <p className="mt-6 text-sm leading-relaxed text-ink/60">
            At Sophisticat, we believe in celebrating beauty, confidence, and
            self-expression. Our jewelry, beaded bracelets, turbans, and
            African prints are carefully curated to help you shine every day.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink/60">
            From timeless pieces to statement prints, we are committed to
            quality, elegance, and exceptional care — designed in Lagos for
            women everywhere.
          </p>
          <Link href="/about" className="btn-primary mt-8 self-start">
            Our Story
          </Link>
        </div>

        <ProductImage
          imageKey="turbans"
          src="/images/gold_jewelries.jpg"
          alt="Sophisticat beaded bracelets and turban"
          ratio="aspect-[3/4] lg:aspect-auto"
        />
      </div>

      <div className="container-luxe mt-0">
        <div className="grid grid-cols-2 divide-x divide-y divide-stone-line border border-t-0 border-stone-line sm:grid-cols-4 sm:divide-y-0">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center justify-center gap-1 py-8 text-center">
              <span className="font-display text-3xl text-gold-500">{s.value}</span>
              <span className="text-[11px] uppercase tracking-wide2 text-ink/50">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
