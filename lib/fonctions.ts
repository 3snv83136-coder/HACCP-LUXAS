export const FONCTIONS_ETABLISSEMENT = [
  { value: "gerant", label: "Gérant / dirigeant" },
  { value: "responsable", label: "Responsable d’établissement" },
  { value: "chef_cuisine", label: "Chef de cuisine" },
  { value: "second", label: "Second de cuisine" },
  { value: "commis", label: "Commis" },
  { value: "plongeur", label: "Plongeur" },
  { value: "serveur", label: "Service en salle" },
  { value: "autre", label: "Autre" },
] as const;

export type FonctionEtablissement = (typeof FONCTIONS_ETABLISSEMENT)[number]["value"];

export function estFonction(value: string): value is FonctionEtablissement {
  return FONCTIONS_ETABLISSEMENT.some((f) => f.value === value);
}

export function roleDepuisFonction(fonction: string) {
  if (fonction === "gerant") return "gerant" as const;
  if (fonction === "responsable") return "responsable" as const;
  return "operateur" as const;
}

export function sirenOuSiretValide(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 9 || digits.length === 14;
}
