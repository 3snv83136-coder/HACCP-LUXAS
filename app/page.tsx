import Link from "next/link";
import { ArrowRight, ChefHat, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-300">
        Plan de maîtrise sanitaire
      </p>
      <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
        Sanitrace
      </h1>
      <p className="mt-4 max-w-xl text-lg text-white/60">
        Relevés en 5 secondes, dossier DDPP à tout moment. Terrain hors-ligne,
        back-office multi-établissement.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/terrain"
          className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-teal-400/40 hover:bg-white/[0.07]"
        >
          <ChefHat className="h-8 w-8 text-teal-300" />
          <h2 className="mt-4 text-2xl font-semibold text-white">Terrain</h2>
          <p className="mt-2 text-sm text-white/55">
            Tablette cuisine. Scan QR, relevé T°, ménage, réception, signature par code.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-300">
            Ouvrir l’app opérateur <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/backoffice"
          className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-sky-400/40 hover:bg-white/[0.07]"
        >
          <LayoutDashboard className="h-8 w-8 text-sky-300" />
          <h2 className="mt-4 text-2xl font-semibold text-white">Back-office</h2>
          <p className="mt-2 text-sm text-white/55">
            Dashboard, non-conformités, QR équipements, seuils PMS, export dossier.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
            Ouvrir le gérant <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </main>
  );
}
