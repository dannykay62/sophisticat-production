import { cn } from "@/lib/utils";

/**
 * Stand-in for real photography until Cloudinary-hosted images are wired in.
 * Renders a tasteful duotone gradient + monogram so the UI never shows a
 * broken image or generic gray box. Swap for a real <Image> using the
 * product's Cloudinary URL when photography is available — see README.
 */

const PALETTES: Record<string, [string, string]> = {
  jewelry: ["#3D0B0B", "#C9A24B"],
  "beaded-bracelets": ["#4A1010", "#D6B15F"],
  turbans: ["#5C1414", "#E6C97D"],
  "african-prints-designs": ["#3D0B0B", "#B0863A"],
  hero: ["#3D0B0B", "#C9A24B"],
  avatar: ["#4A1010", "#D6B15F"],
  blog: ["#3D0B0B", "#C9A24B"],
  default: ["#3D0B0B", "#C9A24B"],
};

function paletteFor(key: string): [string, string] {
  const base = key.replace(/-\d+$/, "");
  return PALETTES[base] ?? PALETTES.default;
}

export default function ProductImage({
  imageKey,
  alt,
  label,
  className,
  ratio = "aspect-[3/4]",
  src,
}: {
  imageKey: string;
  alt: string;
  label?: string;
  className?: string;
  ratio?: string;
  /** Real photo URL (e.g. from Cloudinary/the API). When provided, this
   * renders instead of the gradient placeholder. */
  src?: string | null;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn("w-full object-cover", ratio, className)}
      />
    );
  }

  const [from, to] = paletteFor(imageKey);
  const id = `mono-${imageKey}`;

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative w-full overflow-hidden", ratio, className)}
      style={{
        background: `linear-gradient(160deg, ${from} 0%, ${from} 55%, ${to} 150%)`,
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        viewBox="0 0 200 260"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={id} width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M25 4 L46 25 L25 46 L4 25 Z" fill="none" stroke="currentColor" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="200" height="260" fill={`url(#${id})`} className="text-gold-200" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-300/50">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold-200" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 2 L22 9 L18 22 L6 22 L2 9 Z" />
          </svg>
        </span>
        {label && (
          <span className="font-display text-sm tracking-wide2 uppercase text-gold-100/90">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
