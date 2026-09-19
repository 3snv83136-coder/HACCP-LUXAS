import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TracabilitePage() {
  const lots = await prisma.lotProduit.findMany({
    include: { etablissement: true },
    orderBy: { dlcSecondaire: "asc" },
    take: 50,
  });
  const now = new Date();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold sm:text-3xl">Traçabilité lots & DLC secondaires</h1>
      <p className="text-slate-500">
        Registre entrée → transformation → étiquette. Vue filtrée jour / semaine / mois dans{" "}
        <Link href="/backoffice/produits" className="text-teal-700">
          Produits
        </Link>
        .
      </p>
      <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-4 py-3">Produit</th>
              <th>Type</th>
              <th>Lot source</th>
              <th>DLC sec.</th>
              <th>Étab.</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{l.produit}</td>
                <td>{l.type}</td>
                <td>{l.lotSource ?? "—"}</td>
                <td className={l.dlcSecondaire < now ? "text-red-700" : ""}>
                  {l.dlcSecondaire.toLocaleString("fr-FR")}
                </td>
                <td>{l.etablissement.nom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
