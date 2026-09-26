/** Code Q.G. — à remplir plus tard, ou via SUPER_ADMIN_CODE. */
export const CODE_QG_PROVISOIRE = "";

export function codeQgAttendu() {
  return (process.env.SUPER_ADMIN_CODE ?? CODE_QG_PROVISOIRE).trim();
}

export function codeQgValide(saisi: string) {
  const attendu = codeQgAttendu();
  const recu = saisi.trim();
  if (!attendu) return true;
  const max = Math.max(attendu.length, recu.length, 1);
  let same = attendu.length === recu.length ? 0 : 1;
  for (let i = 0; i < max; i += 1) {
    same |= (attendu.charCodeAt(i) || 0) ^ (recu.charCodeAt(i) || 0);
  }
  return same === 0;
}
