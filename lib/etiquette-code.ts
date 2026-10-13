export function genererCodeBarres() {
  const t = Date.now().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const r = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(2, 6);
  return `ST${t}${r}`.slice(0, 12);
}

export function codeEtiquette(id: string, lot?: string | null) {
  const fromLot = (lot ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9.\- ]/g, "")
    .trim()
    .slice(0, 12);
  if (fromLot) return fromLot;
  return id.replace(/[^0-9A-Z]/gi, "").slice(-10).toUpperCase() || genererCodeBarres();
}
