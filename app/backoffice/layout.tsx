import Link from "next/link";
import {
  Archive,
  Bug,
  FileText,
  GraduationCap,
  LayoutDashboard,
  QrCode,
  Scale,
  ShieldAlert,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/backoffice", label: "Dashboard", icon: LayoutDashboard },
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

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <div className="flex min-h-dvh">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 text-slate-900 lg:block">
          <Link href="/" className="block">
            <p className="text-[11px] uppercase tracking-[0.22em] text-teal-700">Sanitrace</p>
            <p className="mt-1 text-lg font-semibold">Back-office</p>
          </Link>
          <nav className="mt-8 space-y-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/terrain" className="mt-10 block text-xs text-slate-400">
            ← App terrain
          </Link>
        </aside>
        <div className="flex-1">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
            <p className="font-semibold">Luxas — multi-établissement</p>
            <Link href="/" className="text-sm text-slate-500">
              Accueil
            </Link>
          </header>
          <div className="px-4 py-6 md:px-8">{children}</div>
          <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 gap-1 border-t border-slate-200 bg-white p-2 lg:hidden">
            {nav.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] uppercase text-slate-600")}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
