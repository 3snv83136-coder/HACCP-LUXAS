const FALLBACK_PROPRIETAIRES = ["3snv83136@gmail.com"];

export function emailsSuperAdmin(): Set<string> {
  const depuisEnv = (process.env.CREATOR_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...FALLBACK_PROPRIETAIRES, ...depuisEnv]);
}

export function estSuperAdminAutorise(email: string) {
  return emailsSuperAdmin().has(email.trim().toLowerCase());
}
