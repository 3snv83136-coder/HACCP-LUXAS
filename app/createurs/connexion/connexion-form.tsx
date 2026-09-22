"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackArrow } from "@/components/navigation/back-arrow";
import { BrandLogo, SanitraceNom } from "@/components/brand/logo";

export function CreateursConnexionForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [initialise, setInitialise] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/createurs/statut")
      .then((r) => r.json() as Promise<{ initialise?: boolean }>)
      .then((d) => setInitialise(Boolean(d.initialise)))
      .catch(() => setInitialise(true));
  }, []);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/createurs/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse, prenom, nom }),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Connexion impossible");
      return;
    }
    const next = search.get("next");
    router.replace(next && next.startsWith("/createurs") ? next : "/createurs");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <BackArrow />
      <BrandLogo size={56} className="mt-8" />
      <SanitraceNom className="mt-4" />
      <h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900">
        {initialise === false ? "Créer l’accès créateurs" : "Espace créateurs"}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {initialise === false
          ? "Premier accès : ce compte verra tous les établissements inscrits sur Sanitrace."
          : "Tableau de bord de la plateforme — tous les restaurants clients."}
      </p>

      <form className="mt-8 space-y-4" onSubmit={(e) => void envoyer(e)}>
        {initialise === false ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <Label>Prénom</Label>
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <Label>Nom</Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} />
            </label>
          </div>
        ) : null}
        <label className="block space-y-1.5">
          <Label>E-mail</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <Label>Mot de passe</Label>
          <Input
            type="password"
            required
            minLength={8}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full" size="lg" disabled={saving || initialise === null}>
          {saving ? "Connexion…" : initialise === false ? "Créer l’accès" : "Entrer"}
        </Button>
      </form>
    </main>
  );
}
