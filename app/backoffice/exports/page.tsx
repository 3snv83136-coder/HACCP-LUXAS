import { prisma } from "@/lib/db";
import { formatDateHeure, formatTemp } from "@/lib/utils";
import { PrintButton } from "@/components/backoffice/print-button";
import { PdfDownloadButton } from "@/components/backoffice/pdf-download";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ExportsPage() {
  const etab = await prisma.etablissement.findFirst();
  const depuis = new Date();
  depuis.setDate(depuis.getDate() - 7);

  const releves = etab
    ? await prisma.releveTemperature.findMany({
        where: { etablissementId: etab.id, createdAt: { gte: depuis } },
        include: {
          equipement: true,
          pointControle: true,
          codeOperateur: { include: { membre: { include: { utilisateur: true } } } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const ncs = etab
    ? await prisma.nonConformite.findMany({
        where: { etablissementId: etab.id, createdAt: { gte: depuis } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const archives = etab
    ? await prisma.documentPms.findMany({
        where: { etablissementId: etab.id, categorie: "export_ddpp" },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return (
    <div className="space-y-6 pb-16 print:bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Dossier sanitaire DDPP</h1>
          <p className="text-slate-500">
            {etab?.nom} · génération PDF archivée (inaltérable) + aperçu 7 jours
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PdfDownloadButton />
          <PrintButton />
        </div>
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Archives PDF</h2>
        <ul className="mt-3 space-y-2">
          {archives.length === 0 ? <li className="text-sm text-slate-500">Aucun export encore.</li> : null}
          {archives.map((a) => (
            <li key={a.id}>
              <a href={a.fichierUrl ? `/api/documents/${a.id}` : "#"} className="text-teal-800 underline">
                {a.titre} · v{a.version}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Relevés de températures</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="py-2">Date</th>
              <th>Cible</th>
              <th>T°</th>
              <th>OK</th>
              <th>Auteur</th>
            </tr>
          </thead>
          <tbody>
            {releves.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="py-2">{formatDateHeure(r.createdAt)}</td>
                <td>{r.equipement?.nom ?? r.pointControle?.libelle}</td>
                <td className="font-mono">{formatTemp(r.valeur)}</td>
                <td>{r.conforme ? "OK" : "NOK"}</td>
                <td>
                  {r.codeOperateur.membre.utilisateur.prenom} {r.codeOperateur.membre.utilisateur.nom}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Non-conformités de la période</h2>
        <ul className="mt-3 space-y-2">
          {ncs.map((nc) => (
            <li key={nc.id} className="rounded-2xl border border-slate-100 px-4 py-3">
              {nc.constat}{" "}
              <span className="text-xs uppercase text-slate-400">
                {nc.statut} · {nc.gravite}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
