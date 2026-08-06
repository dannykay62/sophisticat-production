"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { testimonials } from "@/lib/data";

export default function Testimonials() {
  return (
    <section className="bg-ink py-20 md:py-28">
      <div className="container-luxe">
        <div className="mb-14 text-center">
          <span className="eyebrow-on-dark">Client Love</span>
          <h2 className="mt-3 text-display-lg text-cream">What They&apos;re Saying</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="border border-stone-lineDark p-8"
            >
              <Quote className="h-6 w-6 text-gold-400" strokeWidth={1.3} />
              <div className="mt-5 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-cream/70">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-400/15 font-display text-sm text-gold-300">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-cream">{t.name}</p>
                  <p className="text-xs text-cream/40">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
