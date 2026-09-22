import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
  src?: string | null;
  alt?: string;
};

export function BrandLogo({ size = 64, className, priority = false, src, alt }: BrandLogoProps) {
  const classes = cn("rounded-2xl object-cover shadow-sm", className);
  if (src) {
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      return (
        // Logo établissement stocké en data URL (inscription).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? "Logo de l’établissement"} width={size} height={size} className={classes} />
      );
    }
    return (
      <Image
        src={src}
        alt={alt ?? "Logo de l’établissement"}
        width={size}
        height={size}
        priority={priority}
        className={classes}
      />
    );
  }

  return (
    <span
      aria-label="Sanitrace"
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-teal-700 font-serif font-semibold text-white shadow-sm",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(14, size * 0.42) }}
    >
      S
    </span>
  );
}

export function SanitraceNom({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700", className)}>
      Sanitrace
    </p>
  );
}
