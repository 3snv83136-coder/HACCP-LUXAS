import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ size = 64, className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/logo-le-zinc-bouillon.png"
      alt="Le Zinc Bouillon — plus qu’un bouillon, un bouillon"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-2xl object-cover shadow-sm", className)}
    />
  );
}
