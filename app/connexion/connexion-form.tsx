"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackArrow } from "@/components/navigation/back-arrow";
import { LogoSanitrace } from "@/components/brand/logo-sanitrace";

export function ConnexionForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [resterConnecte, setResterConnecte] = useState(true);
  const [error, setError] = useState<string | null>(search.get("erreur"));
  const [saving, setSaving] = useState(false);

  async function connecter(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse, resterConnecte }),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Connexion impossible");
      return;
    }
    const next = search.get("next");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/accueil");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8 sm:max-w-lg">
      <BackArrow />
      <LogoSanitrace size={64} className="mt-8" />
      <h1 className="mt-4 font-serif text-3xl font-semibold text-slate-900">Connexion</h1>
      <p className="mt-2 text-sm text-slate-500">E-mail du restaurant et mot de passe.</p>

      <form className="mt-8 space-y-4" onSubmit={(e) => void connecter(e)}>
        <label className="block space-y-1.5">
          <Label>Adresse e-mail du restaurant</Label>
          <Input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <Label>Mot de passe</Label>
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-300 text-teal-700"
            checked={resterConnecte}
            onChange={(e) => setResterConnecte(e.target.checked)}
          />
          Rester connecté
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full" size="lg" disabled={saving || !email || motDePasse.length < 8}>
          {saving ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link href="/creer-compte" className="font-semibold text-teal-800">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
