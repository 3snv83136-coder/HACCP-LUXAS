import { PARAM_KEYS, type ParamMap, requireParam, requireParamNumber } from "@/lib/params";
import { minutesNow, parseHoraire } from "@/lib/utils";

export type Seuils = {
  seuilMin?: number | null;
  seuilMax?: number | null;
};

export function isTemperatureConforme(
  valeur: number,
  seuils: Seuils,
): boolean {
  if (seuils.seuilMin != null && valeur < seuils.seuilMin) return false;
  if (seuils.seuilMax != null && valeur > seuils.seuilMax) return false;
  return true;
}

export function isHuileConforme(
  composesPolaires: number,
  params: ParamMap,
): boolean {
  return composesPolaires <= requireParamNumber(params, PARAM_KEYS.HUILE_COMPOSES_POLAIRES_MAX);
}

export type CreneauReleve = "matin" | "soir";

export function creneauCourant(params: ParamMap, date = new Date()): CreneauReleve {
  const limiteMatin = parseHoraire(requireParam(params, PARAM_KEYS.RELEVE_MATIN_LIMITE));
  const midi = limiteMatin.h * 60 + limiteMatin.m + 60;
  return minutesNow(date) < midi ? "matin" : "soir";
}

export function isCreneauEnRetard(
  creneau: CreneauReleve,
  params: ParamMap,
  date = new Date(),
): boolean {
  const cle =
    creneau === "matin" ? PARAM_KEYS.RELEVE_MATIN_LIMITE : PARAM_KEYS.RELEVE_SOIR_LIMITE;
  const { h, m } = parseHoraire(requireParam(params, cle));
  return minutesNow(date) > h * 60 + m;
}

export function dlcSecondaire(
  type: "decongelation" | "ouverture" | "fabrication",
  debut: Date,
  params: ParamMap,
): Date {
  const heures =
    type === "decongelation"
      ? requireParamNumber(params, PARAM_KEYS.DLC_SECONDAIRE_DECONGEL_HEURES)
      : type === "ouverture"
        ? requireParamNumber(params, PARAM_KEYS.DLC_SECONDAIRE_OUVERTURE_HEURES)
        : requireParamNumber(params, PARAM_KEYS.DLC_SECONDAIRE_OUVERTURE_HEURES);
  return new Date(debut.getTime() + heures * 60 * 60 * 1000);
}

export function destructionPlatTemoin(serviceDate: Date, params: ParamMap): Date {
  const jours = requireParamNumber(params, PARAM_KEYS.PLAT_TEMOIN_JOURS);
  const d = new Date(serviceDate);
  d.setDate(d.getDate() + jours);
  return d;
}
