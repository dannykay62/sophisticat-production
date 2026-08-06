"use client";

import { useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Product, Review } from "@/types";
import { cn } from "@/lib/utils";

const FABRIC_CATEGORIES = ["turbans", "african-prints-designs", "african-prints"];

export default function ProductTabs({ product, reviews }: { product: Product; reviews: Review[] }) {
  const isFabric = FABRIC_CATEGORIES.includes(product.category);
  const tabs = ["Description", "Reviews", "Materials & Care", "Shipping"];
  const [active, setActive] = useState(tabs[0]);

  return (
    <div className="mt-20">
      <div className="flex gap-8 overflow-x-auto border-b border-stone-line">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={cn(
              "shrink-0 border-b-2 pb-4 text-xs uppercase tracking-wide2 transition-colors",
              active === tab ? "border-gold-400 text-ink" : "border-transparent text-ink/45 hover:text-ink"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="py-10">
        {active === "Description" && (
          <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-ink/65">
            <p>{product.description}</p>
            <ul className="space-y-2 pt-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {active === "Reviews" && (
          <div className="max-w-2xl space-y-8">
            <div className="flex items-center gap-4">
              <span className="font-display text-4xl text-ink">{product.rating.toFixed(1)}</span>
              <div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn("h-4 w-4", i < Math.round(product.rating) ? "fill-gold-400 text-gold-400" : "text-stone-line")}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-ink/50">Based on {product.reviewCount} reviews</p>
              </div>
            </div>

            <div className="space-y-6">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-stone-line pb-6 last:border-none">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-gold-400 text-gold-400" : "text-stone-line")} />
                      ))}
                    </div>
                    <span className="text-xs text-ink/40">{r.date}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink">{r.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">{r.body}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/40">
                    {r.verified && <CheckCircle2 className="h-3.5 w-3.5 text-gold-500" />}
                    {r.author} {r.verified && "· Verified Purchase"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === "Materials & Care" && (
          <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-ink/65">
            {isFabric ? (
              <>
                <p>
                  Made from quality, breathable fabric selected for both comfort and how well it holds color and
                  shape over time.
                </p>
                <p className="text-ink/50">
                  Hand wash cold and line dry in shade to keep colors vibrant. Iron on the reverse side on a
                  medium setting.
                </p>
              </>
            ) : (
              <>
                <p>
                  Crafted from quality gold-plated brass, sterling silver, or hand-selected beads, finished to
                  resist tarnish with daily wear. Hypoallergenic and nickel-free.
                </p>
                <p className="text-ink/50">
                  To preserve shine, avoid contact with perfume, lotion, and water. Store in the provided pouch.
                </p>
              </>
            )}
          </div>
        )}

        {active === "Shipping" && (
          <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-ink/65">
            <p>Orders within Lagos arrive in 1-3 working days. Nationwide delivery takes 3-5 working days.</p>
            <p>Every order is insured and requires a signature on delivery. Returns accepted within 14 days in original condition.</p>
          </div>
        )}
      </div>
    </div>
  );
}
