"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackArrow } from "@/components/navigation/back-arrow";
import { BrandLogo, SanitraceNom } from "@/components/brand/logo";

export function ConnexionForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState<string | null>(search.get("erreur"));
  const [saving, setSaving] = useState(false);

  async function connecter(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse }),
    });
    const data = (await res.json()) as { error?: string; slug?: string | null };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Connexion impossible");
      return;
    }
    if (data.slug) localStorage.setItem("sanitrace_identifiant", data.slug);
    const next = search.get("next");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/backoffice");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <BackArrow />
      <BrandLogo size={56} className="mt-8" />
      <SanitraceNom className="mt-4" />
      <h1 className="mt-2 font-serif text-3xl font-semibold text-slate-900">Connexion</h1>
      <p className="mt-2 text-sm text-slate-500">
        E-mail et mot de passe du gérant. Les employés continuent d’entrer avec leur code PIN.
      </p>

      <form className="mt-8 space-y-4" onSubmit={(e) => void connecter(e)}>
        <label className="block space-y-1.5">
          <Label>E-mail</Label>
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
            minLength={8}
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full" size="lg" disabled={saving}>
          {saving ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link href="/creer-compte" className="font-semibold text-teal-800">
          Créer l’établissement
        </Link>
      </p>
      <Link href="/acces/administrateur" className="mt-3 text-sm text-slate-400">
        Accès administrateur par code PIN →
      </Link>

      <details className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Compte déjà créé sans mot de passe ?
        </summary>
        <DefinirMotDePasse
          onOk={(slug) => {
            if (slug) localStorage.setItem("sanitrace_identifiant", slug);
            const next = search.get("next");
            router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/backoffice");
            router.refresh();
          }}
        />
      </details>
    </main>
  );
}

function DefinirMotDePasse({ onOk }: { onOk: (slug?: string | null) => void }) {
  const [email, setEmail] = useState("");
  const [identifiant, setIdentifiant] = useState("");
  const [code, setCode] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/definir-mot-de-passe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, identifiant: identifiant || email, code, motDePasse }),
    });
    const data = (await res.json()) as { error?: string; slug?: string | null };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Impossible d’enregistrer le mot de passe");
      return;
    }
    onOk(data.slug);
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={(e) => void envoyer(e)}>
      <p className="text-xs text-slate-500">
        Entre l’e-mail du restaurant, le code PIN administrateur, puis choisis un mot de passe.
      </p>
      <label className="block space-y-1.5">
        <Label>E-mail du compte</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block space-y-1.5">
        <Label>Nom, slug ou e-mail de l’établissement</Label>
        <Input value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} />
      </label>
      <label className="block space-y-1.5">
        <Label>Code PIN admin (4 chiffres)</Label>
        <Input
          inputMode="numeric"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
      </label>
      <label className="block space-y-1.5">
        <Label>Nouveau mot de passe</Label>
        <Input
          type="password"
          required
          minLength={8}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button className="w-full" disabled={saving || code.length !== 4 || motDePasse.length < 8}>
        {saving ? "Enregistrement…" : "Enregistrer et entrer"}
      </Button>
    </form>
  );
}
