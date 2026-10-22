import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-white/70 text-teal-900",
        ok: "bg-emerald-200 text-emerald-900",
        nok: "bg-red-200 text-red-900",
        warn: "bg-amber-200 text-amber-950",
        info: "bg-teal-200 text-teal-950",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
