import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PARAM_KEYS, SEED_PARAMETRES } from "../lib/params";

const prisma = new PrismaClient();

async function main() {
  const creatorEmail = (process.env.CREATOR_EMAIL ?? "").trim().toLowerCase();
  const creatorPassword = process.env.CREATOR_PASSWORD ?? "";
  if (creatorEmail && creatorPassword.length >= 8) {
    await prisma.comptePlateforme.upsert({
      where: { email: creatorEmail },
      update: { motDePasseHash: await bcrypt.hash(creatorPassword, 10), actif: true },
      create: {
        email: creatorEmail,
        motDePasseHash: await bcrypt.hash(creatorPassword, 10),
        prenom: "Équipe",
        nom: "Sanitrace",
      },
    });
    console.log(`Créateur plateforme : ${creatorEmail}`);
  }

  if (process.env.FORCE_SEED !== "1") {
    const existing = await prisma.organisation.findFirst();
    if (existing) {
      console.log("Seed ignoré — données déjà présentes (FORCE_SEED=1 pour réinitialiser).");
      return;
    }
  }

  await prisma.impression.deleteMany();
  await prisma.captureEtiquette.deleteMany();
  await prisma.alerte.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.nonConformite.deleteMany();
  await prisma.releveHuile.deleteMany();
  await prisma.huileFriture.deleteMany();
  await prisma.checklistExecution.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.executionNettoyage.deleteMany();
  await prisma.tacheNettoyage.deleteMany();
  await prisma.produitNettoyage.deleteMany();
  await prisma.platTemoin.deleteMany();
  await prisma.lotProduit.deleteMany();
  await prisma.reception.deleteMany();
  await prisma.releveTemperature.deleteMany();
  await prisma.planFrequence.deleteMany();
  await prisma.pointControle.deleteMany();
  await prisma.equipement.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.nuisiblesPassage.deleteMany();
  await prisma.documentPms.deleteMany();
  await prisma.codeOperateur.deleteMany();
  await prisma.membreEtablissement.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.parametre.deleteMany();
  await prisma.etablissement.deleteMany();
  await prisma.organisation.deleteMany();

  const org = await prisma.organisation.create({
    data: { nom: "Luxas", siren: null },
  });

  const etab = await prisma.etablissement.create({
    data: {
      organisationId: org.id,
      nom: "Le Zinc Bouillon",
      adresse: "À paramétrer",
      email: "gerant@luxas.local",
      logoUrl: "/logo-le-zinc-bouillon.png",
      slug: "luxas",
      typeCuisine: "restauration_commerciale",
    },
  });

  await prisma.parametre.createMany({
    data: Object.entries(SEED_PARAMETRES).map(([cle, valeur]) => ({
      organisationId: org.id,
      cle,
      valeur,
    })),
  });

  const karim = await prisma.utilisateur.create({
    data: {
      organisationId: org.id,
      nom: "Benali",
      prenom: "Karim",
      email: "karim@luxas.local",
    },
  });
  const sophie = await prisma.utilisateur.create({
    data: {
      organisationId: org.id,
      nom: "Martin",
      prenom: "Sophie",
      email: "sophie@luxas.local",
    },
  });
  const gerant = await prisma.utilisateur.create({
    data: {
      organisationId: org.id,
      nom: "Luxas",
      prenom: "Gérant",
      email: "gerant@luxas.local",
    },
  });

  const membreKarim = await prisma.membreEtablissement.create({
    data: { utilisateurId: karim.id, etablissementId: etab.id, role: "operateur" },
  });
  const membreSophie = await prisma.membreEtablissement.create({
    data: { utilisateurId: sophie.id, etablissementId: etab.id, role: "responsable" },
  });
  const membreGerant = await prisma.membreEtablissement.create({
    data: { utilisateurId: gerant.id, etablissementId: etab.id, role: "gerant" },
  });

  const codeKarim = await prisma.codeOperateur.create({
    data: {
      membreEtablissementId: membreKarim.id,
      codeHash: await bcrypt.hash("2580", 10),
    },
  });
  await prisma.codeOperateur.create({
    data: {
      membreEtablissementId: membreSophie.id,
      codeHash: await bcrypt.hash("1470", 10),
    },
  });
  await prisma.codeOperateur.create({
    data: {
      membreEtablissementId: membreGerant.id,
      codeHash: await bcrypt.hash("3690", 10),
    },
  });

  const froidTres = Number(SEED_PARAMETRES[PARAM_KEYS.TEMP_FROID_POSITIF_TRES_PERISSABLE]);
  const froid = Number(SEED_PARAMETRES[PARAM_KEYS.TEMP_FROID_POSITIF]);
  const congel = Number(SEED_PARAMETRES[PARAM_KEYS.TEMP_CONGELATION]);
  const cuisson = Number(SEED_PARAMETRES[PARAM_KEYS.TEMP_CUISSON_COEUR]);
  const volaille = Number(SEED_PARAMETRES[PARAM_KEYS.TEMP_CUISSON_VOLAILLE]);
  const liaison = Number(SEED_PARAMETRES[PARAM_KEYS.TEMP_LIAISON_CHAUDE]);
  const refroid = Number(SEED_PARAMETRES[PARAM_KEYS.TEMP_REFROIDISSEMENT_CIBLE]);

  const equipements = await Promise.all([
    prisma.equipement.create({
      data: {
        etablissementId: etab.id,
        nom: "Frigo positif 1 — cuisine",
        type: "froid_positif",
        qrToken: "luxas-frigo-1",
        seuilMax: froidTres,
      },
    }),
    prisma.equipement.create({
      data: {
        etablissementId: etab.id,
        nom: "Frigo positif 2 — pâtisserie",
        type: "froid_positif",
        qrToken: "luxas-frigo-2",
        seuilMax: froid,
      },
    }),
    prisma.equipement.create({
      data: {
        etablissementId: etab.id,
        nom: "Congélateur 1",
        type: "congelateur",
        qrToken: "luxas-congel-1",
        seuilMax: congel,
      },
    }),
    prisma.equipement.create({
      data: {
        etablissementId: etab.id,
        nom: "Chambre froide",
        type: "chambre_froide",
        qrToken: "luxas-chambre-1",
        seuilMax: froidTres,
      },
    }),
    prisma.equipement.create({
      data: {
        etablissementId: etab.id,
        nom: "Vitrine réfrigérée",
        type: "vitrine",
        qrToken: "luxas-vitrine-1",
        seuilMax: froid,
      },
    }),
  ]);

  for (const eq of equipements) {
    await prisma.planFrequence.create({
      data: {
        etablissementId: etab.id,
        cibleType: "equipement",
        cibleId: eq.id,
        frequence: "2x_jour",
        horaires: `${SEED_PARAMETRES.RELEVE_MATIN_LIMITE},${SEED_PARAMETRES.RELEVE_SOIR_LIMITE}`,
      },
    });
  }

  await prisma.pointControle.createMany({
    data: [
      {
        etablissementId: etab.id,
        libelle: "Cuisson à cœur",
        type: "cuisson",
        seuilMin: cuisson,
      },
      {
        etablissementId: etab.id,
        libelle: "Cuisson volaille / haché",
        type: "cuisson_volaille",
        seuilMin: volaille,
      },
      {
        etablissementId: etab.id,
        libelle: "Refroidissement rapide",
        type: "refroidissement",
        seuilMax: refroid,
        regleTemps: "TEMP_REFROIDISSEMENT_DUREE_MIN",
      },
      {
        etablissementId: etab.id,
        libelle: "Liaison chaude",
        type: "liaison_chaude",
        seuilMin: liaison,
      },
      {
        etablissementId: etab.id,
        libelle: "Remise en température",
        type: "remise_temperature",
        seuilMin: liaison,
        regleTemps: "TEMP_REMISE_DUREE_MIN",
      },
    ],
  });

  const degraissant = await prisma.produitNettoyage.create({
    data: {
      etablissementId: etab.id,
      nom: "Dégraissant cuisine",
      dosage: "2 %",
      tempsContact: "5 min",
      dangers: "Irritant — gants obligatoires",
    },
  });
  const desinfectant = await prisma.produitNettoyage.create({
    data: {
      etablissementId: etab.id,
      nom: "Désinfectant surfaces alimentaires",
      dosage: "1 %",
      tempsContact: "10 min",
      dangers: "Ne pas rincer si mentionné sur FDS",
    },
  });

  const taches = await Promise.all([
    prisma.tacheNettoyage.create({
      data: {
        etablissementId: etab.id,
        zone: "Plan de travail cuisine",
        produitNettoyageId: desinfectant.id,
        frequence: "par_service",
        methodeTact: "T.A.C.T. — Température ambiante, Action mécanique, Concentration 1 %, Temps 10 min",
        roleResponsable: "operateur",
      },
    }),
    prisma.tacheNettoyage.create({
      data: {
        etablissementId: etab.id,
        zone: "Sols cuisine",
        produitNettoyageId: degraissant.id,
        frequence: "quotidien",
        methodeTact: "T.A.C.T. — eau chaude, action mécanique, 2 %, 5 min",
        roleResponsable: "operateur",
      },
    }),
    prisma.tacheNettoyage.create({
      data: {
        etablissementId: etab.id,
        zone: "Chambre froide — parois et sol",
        produitNettoyageId: desinfectant.id,
        frequence: "hebdo",
        methodeTact: "T.A.C.T. — dégivrage + désinfection",
        roleResponsable: "responsable",
      },
    }),
    prisma.tacheNettoyage.create({
      data: {
        etablissementId: etab.id,
        zone: "Poignées et commandes",
        produitNettoyageId: desinfectant.id,
        frequence: "quotidien",
        methodeTact: "T.A.C.T. — pulvérisation, temps de contact 10 min",
        roleResponsable: "operateur",
      },
    }),
  ]);

  const ouverture = await prisma.checklist.create({
    data: {
      etablissementId: etab.id,
      nom: "Ouverture cuisine",
      type: "ouverture",
      items: {
        create: [
          { libelle: "Lavage des mains + tenue propre", ordre: 1 },
          { libelle: "Contrôle visuel chambres froides", ordre: 2 },
          { libelle: "Relevés T° équipements du matin", ordre: 3 },
          { libelle: "DLC secondaires vérifiées", ordre: 4 },
        ],
      },
    },
  });
  await prisma.checklist.create({
    data: {
      etablissementId: etab.id,
      nom: "Fermeture cuisine",
      type: "fermeture",
      items: {
        create: [
          { libelle: "Relevés T° équipements du soir", ordre: 1 },
          { libelle: "Plats témoins étiquetés", ordre: 2 },
          { libelle: "Nettoyage de fin de service", ordre: 3 },
          { libelle: "Poubelle vidée / locaux fermés", ordre: 4 },
        ],
      },
    },
  });

  const hier = new Date();
  hier.setDate(hier.getDate() - 1);
  hier.setHours(9, 12, 0, 0);

  for (const eq of equipements) {
    const valeur =
      eq.type === "congelateur" ? congel - 1 : (eq.seuilMax ?? froid) - 1.2;
    await prisma.releveTemperature.create({
      data: {
        clientUuid: `seed-${eq.id}-hier-matin`,
        etablissementId: etab.id,
        equipementId: eq.id,
        valeur,
        conforme: true,
        methode: "sonde_manuelle",
        codeOperateurId: codeKarim.id,
        createdAt: hier,
      },
    });
  }

  await prisma.nonConformite.create({
    data: {
      etablissementId: etab.id,
      source: "manuel",
      constat: "Joint du frigo pâtisserie fendu — condensation anormale.",
      gravite: "moyenne",
      actionImmediate: "Denrées transférées au frigo 1. Demande SAV.",
      responsableId: membreSophie.id,
      statut: "ouvert",
    },
  });

  const huile = await prisma.huileFriture.create({
    data: { etablissementId: etab.id, bac: "Friteuse 1" },
  });
  await prisma.releveHuile.create({
    data: {
      clientUuid: "seed-huile-1",
      huileId: huile.id,
      composesPolaires: 14,
      action: "ok",
      codeOperateurId: codeKarim.id,
    },
  });

  await prisma.platTemoin.create({
    data: {
      clientUuid: "seed-temoin-1",
      etablissementId: etab.id,
      plat: "Daube de bœuf",
      serviceDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      codeOperateurId: codeKarim.id,
      destructionPrevue: new Date(),
    },
  });

  await prisma.lotProduit.create({
    data: {
      etablissementId: etab.id,
      type: "ouverture",
      produit: "Crème fraîche 1 L",
      lotSource: "LOT-8841",
      dateDebut: new Date(),
      dlcSecondaire: new Date(Date.now() + 36 * 3600 * 1000),
      qrToken: "lot-creme-demo",
      createdBy: codeKarim.id,
    },
  });

  await prisma.documentPms.create({
    data: {
      etablissementId: etab.id,
      titre: "Plan de Maîtrise Sanitaire — version de travail",
      categorie: "pms",
      version: "1.0",
    },
  });

  const expireBientot = new Date();
  expireBientot.setDate(expireBientot.getDate() + 20);
  await prisma.formation.create({
    data: {
      membreEtablissementId: membreKarim.id,
      type: "hygiene_alimentaire",
      obtenueLe: new Date("2025-03-12"),
      expireLe: expireBientot,
    },
  });
  await prisma.formation.create({
    data: {
      membreEtablissementId: membreSophie.id,
      type: "hygiene_alimentaire",
      obtenueLe: new Date("2024-01-10"),
      expireLe: new Date("2027-01-10"),
    },
  });

  await prisma.nuisiblesPassage.create({
    data: {
      etablissementId: etab.id,
      prestataire: "À renseigner",
      date: new Date(),
      observations: "Contrat prestataire à rattacher.",
    },
  });

  const nice = await prisma.etablissement.create({
    data: {
      organisationId: org.id,
      nom: "Sandwicherie Nice",
      adresse: "Nice",
      slug: "nice",
      typeCuisine: "restauration_commerciale",
    },
  });
  await prisma.membreEtablissement.create({
    data: { utilisateurId: gerant.id, etablissementId: nice.id, role: "gerant" },
  });
  await prisma.equipement.create({
    data: {
      etablissementId: nice.id,
      nom: "Frigo positif — labo",
      type: "froid_positif",
      qrToken: "nice-frigo-1",
      seuilMax: Number(SEED_PARAMETRES[PARAM_KEYS.TEMP_FROID_POSITIF]),
    },
  });
  await prisma.nuisiblesPassage.create({
    data: {
      etablissementId: nice.id,
      prestataire: SEED_PARAMETRES.NUISIBLES_PRESTATAIRE,
      date: new Date(),
      observations: "Plan d'appâts à importer.",
    },
  });

  await prisma.auditLog.create({
    data: {
      etablissementId: etab.id,
      acteur: "seed",
      action: "bootstrap",
      cible: "organisation",
      payloadJson: JSON.stringify({
        organisation: org.nom,
        etablissement: etab.nom,
        second: nice.nom,
        gerantMembre: membreGerant.id,
        codesDemo: { operateur: "2580", responsable: "1470", gerant: "3690" },
        ouvertureId: ouverture.id,
        taches: taches.length,
      }),
    },
  });

  console.log("Seed OK — Le Zinc Bouillon (Luxas)");
  console.log("Codes : opérateur 2580 · responsable 1470 · gérant 3690");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
