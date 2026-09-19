export type PeriodeHygiene = "jour" | "semaine" | "mois";

export function plageHygiene(periode: PeriodeHygiene, ref = new Date()) {
  const end = new Date(ref);
  end.setHours(23, 59, 59, 999);
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);

  if (periode === "semaine") {
    const day = start.getDay();
    const toMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + toMonday);
  }
  if (periode === "mois") {
    start.setDate(1);
    end.setMonth(start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export function labelPlage(periode: PeriodeHygiene, start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
  if (periode === "jour") return fmt(start);
  return `${fmt(start)} → ${fmt(end)}`;
}
