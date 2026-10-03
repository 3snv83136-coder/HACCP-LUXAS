"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function parentHref(pathname: string): string {
  if (pathname === "/accueil") return "/accueil";
  if (pathname === "/terrain" || pathname === "/backoffice" || pathname === "/hygiene") return "/accueil";
  if (pathname === "/createurs" || pathname === "/createurs/connexion") return "/accueil";
  if (pathname === "/station-impression") return "/accueil";
  if (pathname === "/connexion" || pathname === "/creer-compte") return "/";
  if (pathname.startsWith("/acces/")) return "/accueil";
  if (pathname.startsWith("/terrain/")) return "/terrain";
  if (pathname.startsWith("/backoffice/")) return "/backoffice";
  if (pathname.startsWith("/hygiene/")) return "/hygiene";
  if (pathname.startsWith("/createurs/")) return "/createurs";
  return "/accueil";
}

export function BackArrow({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/accueil") return null;

  function goBack() {
    const ref = typeof document !== "undefined" ? document.referrer : "";
    const sameOrigin = Boolean(ref) && ref.startsWith(window.location.origin);
    if (sameOrigin && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(parentHref(pathname));
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Retour"
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
        className,
      )}
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
    </button>
  );
}
