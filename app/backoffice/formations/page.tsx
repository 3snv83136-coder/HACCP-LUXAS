import { prisma } from "@/lib/db";

export default async function FormationsPage() {
  const formations = await prisma.formation.findMany({
    include: { membre: { include: { utilisateur: true, etablissement: true } } },
    orderBy: { expireLe: "asc" },
  });
  const now = Date.now();

  return (
    <div className="space-y-5 pb-16">
      <h1 className="text-3xl font-semibold">Formations & habilitations</h1>
      <p className="text-slate-500">Alerte de recyclage selon FORMATION_ALERTE_JOURS (PMS).</p>
      <div className="space-y-3">
        {formations.map((f) => {
          const expire = f.expireLe ? f.expireLe.getTime() : null;
          const soon = expire != null && expire - now < 90 * 24 * 3600 * 1000;
          return (
            <article key={f.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="font-semibold">
                {f.membre.utilisateur.prenom} {f.membre.utilisateur.nom} — {f.type.replaceAll("_", " ")}
              </p>
              <p className="text-sm text-slate-500">
                {f.membre.etablissement.nom} · obtenue {f.obtenueLe.toLocaleDateString("fr-FR")}
                {f.expireLe ? ` · expire ${f.expireLe.toLocaleDateString("fr-FR")}` : ""}
                {soon ? " · à renouveler" : ""}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
