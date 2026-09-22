import { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductImage from "@/components/ui/ProductImage";

export const metadata: Metadata = {
  title: "About Us",
  description: "The story behind Sophisticat — quality jewelry, beaded bracelets, turbans, and African prints, designed in Lagos.",
};

const PILLARS = [
  {
    title: "Our Mission",
    body: "To make beauty feel personal — curating jewelry, bracelets, turbans, and prints that help every woman feel radiant, confident, and seen.",
  },
  {
    title: "Our Craft",
    body: "Every jewelry piece is 18k gold-plated and hand-finished; every fabric is chosen for how well it holds color, shape, and comfort over time.",
  },
  {
    title: "Our Promise",
    body: "Authentic materials, honest pricing, and a returns policy that puts you first. If it's not right, we'll make it right.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-cream py-10 md:py-16">
        <div className="container-luxe">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
          <div className="mt-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="eyebrow">Est. Chicago, USA</span>
              <h1 className="mt-4 text-display-xl text-ink">
                Beauty, elegance,
                <br />
                sophistication.
              </h1>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/60">
                Sophisticat began with a simple belief: that Nigerian women
                deserve jewelry, bracelets, turbans, and prints that rival
                the world&apos;s most celebrated houses — without leaving
                home to find them. Every piece we curate is chosen in Chicago,
                for the way you actually live.
              </p>
              <Link href="/shop" className="btn-primary mt-8 inline-flex">
                Shop The Collection
              </Link>
            </div>
            <ProductImage imageKey="hero" src="/images/sophisticat_necklace.png" alt="Sophisticat founder story" className="w-full h-full aspect-[4/5] object-contain p-4" />
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 md:py-28">
        <div className="container-luxe grid grid-cols-1 gap-10 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="border-t border-gold-400 pt-6">
              <h2 className="font-display text-2xl text-cream">{p.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-cream/60">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream py-20 md:py-28">
        <div className="container-luxe grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <ProductImage imageKey="turbans"src="/images/sophisticat_turban.png" alt="Sophisticat quality promise" className="w-full h-full aspect-[4/5] object-contain p-4 order-2 lg:order-1" />
          <div className="order-1 lg:order-2">
            <span className="eyebrow">Quality Promise</span>
            <h2 className="mt-4 text-display-md text-ink">Made to last, priced to wear daily</h2>
            <p className="mt-6 text-sm leading-relaxed text-ink/60">
              We work directly with artisans and fabric sourcers to cut out
              markup without cutting corners. That means 18k gold plating
              that resists tarnish, and fabric that holds its color wash
              after wash — at a price built for everyday wear, not just
              special occasions.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ink/60">
              <li>&middot; Nickel-free, hypoallergenic jewelry</li>
              <li>&middot; Hand-selected, colorfast fabrics</li>
              <li>&middot; 14-day returns on every order</li>
              <li>&middot; Complimentary signature gift packaging</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
