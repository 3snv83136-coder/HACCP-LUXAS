"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function parentHref(pathname: string): string | null {
  if (pathname === "/") return null;
  if (pathname === "/terrain" || pathname === "/backoffice") return "/";
  if (pathname.startsWith("/terrain/")) return "/terrain";
  if (pathname.startsWith("/backoffice/")) return "/backoffice";
  return "/";
}

export function BackArrow({ className }: { className?: string }) {
  const pathname = usePathname();
  const href = parentHref(pathname);
  if (!href) return null;

  return (
    <Link
      href={href}
      aria-label="Retour"
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
        className,
      )}
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
    </Link>
  );
}
