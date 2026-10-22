import { prisma } from "@/lib/db";
import { PARAM_KEYS } from "@/lib/params";
import { JOURS_RELEVE_DEFAUT } from "@/lib/jours-releve";

export async function assurerParamsJoursReleve(organisationId: string, params: Record<string, string>) {
  for (const cle of [PARAM_KEYS.RELEVE_MATIN_JOURS, PARAM_KEYS.RELEVE_SOIR_JOURS]) {
    if (params[cle]) continue;
    await prisma.parametre.upsert({
      where: { organisationId_cle: { organisationId, cle } },
      update: {},
      create: { organisationId, cle, valeur: JOURS_RELEVE_DEFAUT },
    });
    params[cle] = JOURS_RELEVE_DEFAUT;
  }
}
