"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQItem } from "@/types";
import { cn } from "@/lib/utils";

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-stone-line border-y border-stone-line">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between py-5 text-left"
            aria-expanded={open === i}
          >
            <span className="text-sm font-medium text-ink">{item.question}</span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-gold-500 transition-transform duration-300", open === i && "rotate-180")} />
          </button>
          <div
            className={cn(
              "grid overflow-hidden transition-all duration-300 ease-luxury",
              open === i ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <p className="overflow-hidden text-sm leading-relaxed text-ink/60">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
