"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackArrow } from "@/components/navigation/back-arrow";
import { BrandLogo } from "@/components/brand/logo";

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
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-[#07090d] px-6 py-10 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.14),_transparent_42%)]" />
      <div className="relative">
      <BackArrow />
      <BrandLogo size={56} className="mt-8" />
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">Sanitrace · Q.G.</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-white">
        {initialise === false ? "Activer le super administrateur" : "Identification"}
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        {initialise === false
          ? "Premier accès : ce compte voit et peut supprimer tous les établissements."
          : "Accès super administrateur. Les restaurants n’ont pas cette porte."}
      </p>

      <form className="mt-8 space-y-4" onSubmit={(e) => void envoyer(e)}>
        {initialise === false ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <Label className="text-zinc-300">Prénom</Label>
              <Input className="border-white/15 bg-black/40 text-white" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <Label className="text-zinc-300">Nom</Label>
              <Input className="border-white/15 bg-black/40 text-white" value={nom} onChange={(e) => setNom(e.target.value)} />
            </label>
          </div>
        ) : null}
        <label className="block space-y-1.5">
          <Label className="text-zinc-300">E-mail</Label>
          <Input
            className="border-white/15 bg-black/40 text-white"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <Label className="text-zinc-300">Mot de passe</Label>
          <Input
            className="border-white/15 bg-black/40 text-white"
            type="password"
            required
            minLength={8}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button className="w-full bg-amber-300 text-black hover:bg-amber-200" size="lg" disabled={saving || initialise === null}>
          {saving ? "Vérification…" : initialise === false ? "Activer l’accès" : "Entrer"}
        </Button>
      </form>
      </div>
    </main>
  );
}
