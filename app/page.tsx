import Link from "next/link";
import { ChefHat, ClipboardCheck, LayoutDashboard, ShieldCheck } from "lucide-react";
import { TitreAccesSecret, MarqueAccesSecret } from "@/components/brand/titre-acces-secret";

const acces = [
  {
    href: "/acces/employes",
    label: "Accès employés",
    texte: "Relevés, ménage, réceptions et étiquettes sur le terrain.",
    icon: ChefHat,
    tone: "border-teal-200 hover:border-teal-500",
    iconTone: "bg-teal-50 text-teal-800",
  },
  {
    href: "/acces/administrateur",
    label: "Accès administrateur",
    texte: "Équipe, frigos, friteuses, surfaces et paramétrage PMS.",
    icon: LayoutDashboard,
    tone: "border-slate-200 hover:border-slate-900",
    iconTone: "bg-slate-100 text-slate-800",
  },
  {
    href: "/acces/hygiene",
    label: "Accès hygiène",
    texte: "Dossier inspecteur et export PDF filtré par employé, mois et type.",
    icon: ClipboardCheck,
    tone: "border-sky-200 hover:border-sky-500",
    iconTone: "bg-sky-50 text-sky-800",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.08),_transparent_42%)]" />
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <MarqueAccesSecret />
            <p className="mt-1 text-sm text-slate-500">Plan de maîtrise sanitaire</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/connexion"
              className="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900"
            >
              Se connecter
            </Link>
            <Link
              href="/creer-compte"
              className="inline-flex h-11 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white"
            >
              Créer le compte
            </Link>
          </div>
        </header>

        <section className="mt-16 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Un compte par établissement
          </div>
          <TitreAccesSecret />
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            Chaque restaurant a son espace isolé : employés, enceintes froides, friteuses,
            surfaces de nettoyage, étiquettes et dossier DDPP.
          </p>
        </section>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {acces.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`group rounded-3xl border bg-white p-6 shadow-sm transition ${a.tone}`}
            >
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${a.iconTone}`}>
                <a.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 font-serif text-xl font-semibold text-slate-900">{a.label}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{a.texte}</p>
              <p className="mt-6 text-sm font-semibold text-teal-800">Ouvrir →</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
