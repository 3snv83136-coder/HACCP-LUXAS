import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DocumentsPage() {
  const docs = await prisma.documentPms.findMany({ orderBy: { createdAt: "desc" } });
  const formations = await prisma.formation.findMany({
    include: { membre: { include: { utilisateur: true } } },
  });

  return (
    <div className="space-y-6 pb-16">
      <h1 className="text-3xl font-semibold">Documentaire PMS & formations</h1>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Documents</h2>
        <ul className="mt-3 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="rounded-2xl border border-slate-100 px-4 py-3">
              <p className="font-medium">{d.titre}</p>
              <p className="text-sm text-slate-500">
                {d.categorie} · v{d.version}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Formations</h2>
        <ul className="mt-3 space-y-2">
          {formations.map((f) => (
            <li key={f.id} className="rounded-2xl border border-slate-100 px-4 py-3">
              <p className="font-medium">
                {f.membre.utilisateur.prenom} {f.membre.utilisateur.nom} — {f.type.replaceAll("_", " ")}
              </p>
              <p className="text-sm text-slate-500">
                Obtenue {f.obtenueLe.toLocaleDateString("fr-FR")}
                {f.expireLe ? ` · expire ${f.expireLe.toLocaleDateString("fr-FR")}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
