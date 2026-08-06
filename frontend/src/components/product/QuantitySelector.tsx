"use client";

import { Minus, Plus } from "lucide-react";

export default function QuantitySelector({
  value,
  onChange,
  max = 10,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center border border-stone-line">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-cream-deep disabled:opacity-30"
        disabled={value <= 1}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="flex h-11 w-11 items-center justify-center text-sm text-ink" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-cream-deep disabled:opacity-30"
        disabled={value >= max}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
