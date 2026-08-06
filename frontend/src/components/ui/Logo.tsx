import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="Sophisticat home" className={cn("flex items-center gap-2.5 group", className)}>
      <Image
        src="/images/sophisticat_hor.png"
        alt=""
        width={72}
        height={50}
        priority
        className="h-14 w-auto shrink-0 transition-transform duration-500 ease-luxury group-hover:scale-105"
      />
      <span
        className={cn(
          "font-display text-2xl italic tracking-wide uppercase",
          light ? "text-cream" : "text-red-500"
        )}
      >
        {/* Sophisticat */}
      </span>
    </Link>
  );
}
