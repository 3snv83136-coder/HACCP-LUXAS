import Link from "next/link";
import { ArrowRight, ChefHat, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
        Plan de maîtrise sanitaire
      </p>
      <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
        Sanitrace
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-500">
        Relevés en 5 secondes, dossier DDPP à tout moment. Terrain hors-ligne,
        back-office multi-établissement.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/terrain"
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-400"
        >
          <ChefHat className="h-8 w-8 text-teal-700" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Terrain</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tablette cuisine. Scan QR, relevé T°, ménage, réception — mode entraînement sans code.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            Ouvrir l’app opérateur <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/backoffice"
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-400"
        >
          <LayoutDashboard className="h-8 w-8 text-sky-700" />
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Back-office</h2>
          <p className="mt-2 text-sm text-slate-500">
            Dashboard, non-conformités, QR équipements, seuils PMS, export dossier.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
            Ouvrir le gérant <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </main>
  );
}
