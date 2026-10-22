import { PARAM_KEYS, type ParamMap } from "@/lib/params";
import type { CreneauReleve } from "@/lib/conformity";

export const JOURS_SEMAINE = [
  { n: 1, label: "Lundi" },
  { n: 2, label: "Mardi" },
  { n: 3, label: "Mercredi" },
  { n: 4, label: "Jeudi" },
  { n: 5, label: "Vendredi" },
  { n: 6, label: "Samedi" },
  { n: 0, label: "Dimanche" },
] as const;

export const JOURS_RELEVE_DEFAUT = "0,1,2,3,4,5,6";

export function parseJoursReleve(raw: string | undefined | null) {
  if (raw == null) return [0, 1, 2, 3, 4, 5, 6];
  if (raw.trim() === "") return [];
  return raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => n >= 0 && n <= 6);
}

export function serialiserJoursReleve(jours: number[]) {
  const set = new Set(jours.filter((n) => n >= 0 && n <= 6));
  return JOURS_SEMAINE.map((j) => j.n)
    .filter((n) => set.has(n))
    .join(",");
}

export function creneauOuvertCeJour(creneau: CreneauReleve, params: ParamMap, date = new Date()) {
  const cle = creneau === "matin" ? PARAM_KEYS.RELEVE_MATIN_JOURS : PARAM_KEYS.RELEVE_SOIR_JOURS;
  const jours = parseJoursReleve(params[cle]);
  return jours.includes(date.getDay());
}
