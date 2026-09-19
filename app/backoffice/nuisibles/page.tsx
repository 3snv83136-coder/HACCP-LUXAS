import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function NuisiblesPage() {
  const passages = await prisma.nuisiblesPassage.findMany({
    include: { etablissement: true },
    orderBy: { date: "desc" },
  });
  const prestataire =
    (await prisma.parametre.findFirst({ where: { cle: "NUISIBLES_PRESTATAIRE" } }))?.valeur ?? "—";

  return (
    <div className="space-y-5 pb-16">
      <h1 className="text-3xl font-semibold">Lutte contre les nuisibles (3D)</h1>
      <p className="text-slate-500">Prestataire paramétré : {prestataire}. Passages, observations, rapports.</p>
      <div className="space-y-3">
        {passages.map((p) => (
          <article key={p.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="font-semibold">
              {p.etablissement.nom} · {p.date.toLocaleDateString("fr-FR")}
            </p>
            <p className="text-sm text-slate-500">{p.prestataire}</p>
            <p className="mt-2 text-sm">{p.observations ?? "—"}</p>
            {p.rapportUrl ? (
              <a href={p.rapportUrl} className="mt-2 inline-block text-sm text-teal-800 underline">
                Rapport PDF
              </a>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Rapport prestataire à rattacher (bucket privé).</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
