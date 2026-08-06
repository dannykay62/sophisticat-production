"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ProductImage from "@/components/ui/ProductImage";

export default function Hero() {
  return (
    <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden bg-ink">
      {/* image side */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
        <ProductImage
          imageKey="hero"
          src="/images/sophisticat_hero_1.png"
          alt="Nigerian model wearing Sophisticat jewelry and a turban"
          ratio="h-full"
          className="!aspect-auto"
        />
        {/* gold wipe reveal — the signature moment */}
        <motion.div
          className="absolute inset-0 origin-left bg-cream"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 1.1, ease: [0.83, 0, 0.17, 1], delay: 0.2 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/20 to-transparent lg:from-ink/50" />
      </div>

      <div className="container-luxe relative flex h-full items-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
          className="max-w-2xl"
        >
          <span className="eyebrow-on-dark">Signature Collection</span>
          <h1 className="mt-5 text-display-xl text-cream">
            Beauty. Elegance.
            <br />
            Sophistication.
          </h1>
          <p className="mt-8 max-w-lg text-base leading-8 text-cream/80 md:text-lg">
            Discover handcrafted jewelry and authentic African fashion designed
            to celebrate beauty, confidence, and timeless elegance.
          </p>
          <div className="mt-12 flex flex-wrap gap-5">
            <Link href="/shop/jewelry" className="btn-primary"> 
              Shop Jewelry
            </Link>
            <Link href="/shop/turbans" className="btn-outline-light">
              Explore Turbans
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-cream/70">
            <span>✓ Handcrafted</span>
            <span>✓ Secure Checkout</span>
            <span>✓ Worldwide Shipping</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
