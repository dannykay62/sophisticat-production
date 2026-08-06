"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import { Collection } from "@/types";

export default function FeaturedCollectionsGrid({ collections }: { collections: Collection[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
      {collections.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href={`/shop/${c.slug}`} className="group block">
            <div className="relative overflow-hidden">
              <ProductImage
                imageKey={c.image}
                alt={`${c.name} collection`}
                src={c.imageSrc}
                ratio="aspect-[3/4]"
                className="transition-transform duration-700 ease-luxury group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="font-display text-lg text-cream">{c.name}</p>
                <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide2 text-gold-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Explore <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
