export type EtatHuile = "bonne" | "a_changer";

export function etatHuile(action: string | null | undefined, polaires?: number | null): EtatHuile | null {
  if (action === "a_changer" || action === "vidange") return "a_changer";
  if (action === "bonne" || action === "ok") return "bonne";
  if (polaires != null && Number.isFinite(polaires)) return polaires >= 25 ? "a_changer" : "bonne";
  return null;
}

export function libelleEtatHuile(action: string | null | undefined, polaires?: number | null): string {
  const etat = etatHuile(action, polaires);
  if (etat === "a_changer") return "À changer";
  if (etat === "bonne") return "Bonne";
  return "Pas encore de relevé";
}

export function huileAChanger(action: string | null | undefined, polaires?: number | null): boolean {
  return etatHuile(action, polaires) === "a_changer";
}
