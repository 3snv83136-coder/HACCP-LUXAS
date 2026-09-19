import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AlimConfiancePage() {
  const date = (await prisma.parametre.findFirst({ where: { cle: "ALIMCONFIANCE_DATE" } }))?.valeur ?? "";
  const resultat =
    (await prisma.parametre.findFirst({ where: { cle: "ALIMCONFIANCE_RESULTAT" } }))?.valeur ?? "";

  return (
    <div className="space-y-5 pb-16">
      <h1 className="text-3xl font-semibold">Alim&apos;confiance</h1>
      <p className="max-w-2xl text-slate-600">
        Dispositif officiel de transparence des contrôles sanitaires (DGAL). Sanitrace archive le dossier PMS ;
        le résultat du contrôle officiel se renseigne ici (paramètres PMS) et se consulte sur le site public.
      </p>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm uppercase tracking-wide text-slate-400">Dernier contrôle déclaré</p>
        <p className="mt-2 text-2xl font-semibold">{resultat || "Non renseigné"}</p>
        <p className="text-slate-500">{date || "Date à saisir dans Seuils PMS"}</p>
        <a
          href="https://agriculture.gouv.fr/alimconfiance-les-resultats-des-controles-sanitaires"
          className="mt-4 inline-block text-sm font-semibold text-teal-800 underline"
          target="_blank"
          rel="noreferrer"
        >
          Consulter Alim&apos;confiance (site officiel)
        </a>
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Sondes IoT / Bluetooth</h2>
        <p className="mt-2 text-sm text-slate-600">
          Relevés 100 % manuels en v1, comme prévu. Le champ méthode accepte déjà « sonde connectée » pour la v2,
          sans implémenter le Bluetooth maintenant.
        </p>
      </section>
    </div>
  );
}
