/** Date sentinelle : pas de DLC affichée ni d’alerte. */
export const DLC_NON_APPLICABLE = new Date("2099-12-31T12:00:00.000Z");

export function dlcEstAffichee(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() < 2090;
}
