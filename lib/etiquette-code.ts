export function codeEtiquette(id: string, lot?: string | null) {
  const fromLot = (lot ?? "")
    .toUpperCase()
    .replace(/[^0-9A-Z.\- ]/g, "")
    .trim()
    .slice(0, 12);
  if (fromLot) return fromLot;
  return id.replace(/[^0-9A-Z]/gi, "").slice(-10).toUpperCase() || "SANITRACE";
}
