"use client";

import { useEffect, useState } from "react";

export type CompteAffiche = {
  nom: string;
  logoUrl: string | null;
  prenom: string;
  role: string;
};

export function useEtablissementCourant() {
  const [compte, setCompte] = useState<CompteAffiche | null>(null);

  useEffect(() => {
    let actif = true;
    void fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{
          session?: { etablissementNom?: string; logoUrl?: string | null; prenom?: string; role?: string };
        }>;
      })
      .then((data) => {
        if (!actif || !data?.session) return;
        setCompte({
          nom: data.session.etablissementNom ?? "Établissement",
          logoUrl: data.session.logoUrl ?? null,
          prenom: data.session.prenom ?? "",
          role: data.session.role ?? "",
        });
      })
      .catch(() => undefined);
    return () => {
      actif = false;
    };
  }, []);

  return compte;
}
