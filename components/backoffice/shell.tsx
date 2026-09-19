"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Archive,
  Bug,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Package,
  QrCode,
  Scale,
  ShieldAlert,
  SlidersHorizontal,
  Tags,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackArrow } from "@/components/navigation/back-arrow";
import { BrandLogo } from "@/components/brand/logo";

const nav = [
  { href: "/backoffice", label: "Dashboard", icon: LayoutDashboard },
  { href: "/backoffice/hygiene", label: "Contrôle hygiène", icon: ClipboardCheck },
  { href: "/backoffice/produits", label: "Produits", icon: Package },
  { href: "/backoffice/personnel", label: "Salariés", icon: Users },
  { href: "/backoffice/non-conformites", label: "CAPA", icon: ShieldAlert },
  { href: "/backoffice/equipements", label: "Équipements QR", icon: QrCode },
  { href: "/backoffice/tracabilite", label: "Traçabilité", icon: Tags },
  { href: "/backoffice/parametres", label: "Seuils PMS", icon: SlidersHorizontal },
  { href: "/backoffice/formations", label: "Formations", icon: GraduationCap },
  { href: "/backoffice/nuisibles", label: "Nuisibles", icon: Bug },
  { href: "/backoffice/documents", label: "Documentaire", icon: FileText },
  { href: "/backoffice/exports", label: "Exports DDPP", icon: Archive },
  { href: "/backoffice/alimconfiance", label: "Alim'confiance", icon: Scale },
];

const mobileQuick = [
  nav[0],
  nav[2],
  nav[3],
  { href: "#menu", label: "Menu", icon: Menu },
];

function lienActif(href: string, pathname: string) {
  if (href === "/backoffice") return pathname === "/backoffice";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BackofficeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (pathname === "/backoffice/login") {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/backoffice/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white text-slate-900">
      <div className="flex min-h-dvh">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
          <Link href="/" className="block">
            <BrandLogo size={72} className="rounded-2xl" />
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-teal-700">Le Zinc Bouillon</p>
            <p className="mt-1 text-lg font-semibold">Back-office</p>
          </Link>
          <nav className="mt-8 max-h-[calc(100dvh-16rem)] space-y-1 overflow-y-auto pr-1">
            {nav.map((item) => (
              <NavLink key={item.href} item={item} active={lienActif(item.href, pathname)} />
            ))}
          </nav>
          <Link href="/terrain" className="mt-8 block text-xs text-slate-400">
            ← App terrain
          </Link>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-6 md:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <BackArrow />
              <BrandLogo size={36} className="hidden rounded-lg sm:block" />
              <p className="truncate text-sm font-semibold sm:text-base">Le Zinc Bouillon</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 lg:hidden"
                aria-label="Ouvrir le menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => void logout()} className="hidden text-sm text-slate-500 sm:block">
                Quitter
              </button>
            </div>
          </header>

          <div className="min-w-0 flex-1 px-3 py-5 pb-28 sm:px-6 md:px-8 lg:px-8 lg:py-6 lg:pb-8">
            {children}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 gap-1 border-t border-slate-200 bg-white/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        {mobileQuick.map((item) =>
          item.href === "#menu" ? (
            <button
              key="menu"
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] uppercase text-slate-600"
            >
              <Menu className="h-4 w-4" />
              Menu
            </button>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] uppercase",
                lienActif(item.href, pathname) ? "bg-teal-50 text-teal-800" : "text-slate-600",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ),
        )}
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="font-semibold">Menu</p>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200"
              aria-label="Fermer"
              onClick={() => setMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="max-h-[calc(100dvh-5rem)] space-y-1 overflow-y-auto p-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-base",
                  lienActif(item.href, pathname) ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-700",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <Link href="/terrain" onClick={() => setMenuOpen(false)} className="mt-4 block px-3 py-3 text-slate-500">
              App terrain
            </Link>
            <button type="button" onClick={() => void logout()} className="block w-full px-3 py-3 text-left text-red-700">
              Quitter
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof nav)[number];
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm",
        active ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}
