import { prisma } from "@/lib/db";
import { sessionDepuisCookie } from "@/lib/server/session-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DocumentsPage() {
  const session = await sessionDepuisCookie();
  const etabId = session?.etablissementId;
  const docs = etabId
    ? await prisma.documentPms.findMany({
        where: { etablissementId: etabId },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const formations = etabId
    ? await prisma.formation.findMany({
        where: { membre: { etablissementId: etabId } },
        include: { membre: { include: { utilisateur: true } } },
      })
    : [];

  return (
    <div className="space-y-6 pb-16">
      <h1 className="text-3xl font-semibold">Documentaire PMS & formations</h1>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Documents</h2>
        <p className="mt-1 text-sm text-slate-500">Y compris les fiches déposées par Sanitrace.</p>
        <ul className="mt-3 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="rounded-2xl border border-slate-100 px-4 py-3">
              <p className="font-medium">{d.titre}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {d.source === "createur" ? "Envoyé par Sanitrace" : d.categorie} · v{d.version}
              </p>
              {d.commentaire ? <p className="mt-1 text-sm text-slate-600">{d.commentaire}</p> : null}
              {d.fichierUrl ? (
                <a href={`/api/documents/${d.id}`} className="mt-1 inline-block text-sm text-teal-800 underline">
                  Ouvrir le fichier
                </a>
              ) : null}
            </li>
          ))}
          {docs.length === 0 ? <p className="text-sm text-slate-500">Aucun document pour l’instant.</p> : null}
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
