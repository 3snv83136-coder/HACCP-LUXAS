"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackArrow } from "@/components/navigation/back-arrow";
import { FONCTIONS_ETABLISSEMENT } from "@/lib/fonctions";
import { LogoUpload } from "@/components/brand/logo-upload";

export default function CreerComptePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    nomEtablissement: "",
    siren: "",
    adresse: "",
    email: "",
    motDePasse: "",
    motDePasse2: "",
    prenom: "",
    nom: "",
    fonction: "gerant",
  });

  async function creer(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, logoUrl, resterConnecte: true }),
    });
    const data = (await res.json()) as { error?: string; slug?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Inscription impossible");
      return;
    }
    if (data.slug) localStorage.setItem("sanitrace_identifiant", data.slug);
    router.replace("/accueil");
    router.refresh();
  }

  const mdpKo = Boolean(form.motDePasse && form.motDePasse2 && form.motDePasse !== form.motDePasse2);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-6 py-8">
      <BackArrow />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Sanitrace</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900">Créer un compte</h1>
      <p className="mt-2 text-sm text-slate-500">
        Un établissement, un espace isolé. Le même e-mail et mot de passe permettent d’en ajouter
        d’autres ensuite.
      </p>

      <form
        className="mt-8 space-y-8 rounded-3xl border border-teal-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-xl"
        onSubmit={(e) => void creer(e)}
      >
        <fieldset className="space-y-4">
          <legend className="font-serif text-xl font-semibold text-slate-900">L’établissement</legend>
          <Field label="Nom de l’établissement">
            <Input
              required
              value={form.nomEtablissement}
              onChange={(e) => setForm({ ...form, nomEtablissement: e.target.value })}
            />
          </Field>
          <Field label="SIREN ou SIRET">
            <Input
              required
              inputMode="numeric"
              value={form.siren}
              onChange={(e) => setForm({ ...form, siren: e.target.value.replace(/\D/g, "").slice(0, 14) })}
            />
          </Field>
          <Field label="Adresse du restaurant">
            <Input
              required
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            />
          </Field>
          <LogoUpload value={logoUrl} onChange={setLogoUrl} />
          <Field label="Adresse e-mail">
            <Input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mot de passe (8 caractères min.)">
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.motDePasse}
                onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
              />
            </Field>
            <Field label="Confirmer le mot de passe">
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.motDePasse2}
                onChange={(e) => setForm({ ...form, motDePasse2: e.target.value })}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-serif text-xl font-semibold text-slate-900">La personne qui crée le compte</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom">
              <Input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </Field>
            <Field label="Prénom">
              <Input required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </Field>
          </div>
          <Field label="Fonction dans l’établissement">
            <select
              className="h-12 w-full rounded-2xl border border-slate-200 px-3"
              value={form.fonction}
              onChange={(e) => setForm({ ...form, fonction: e.target.value })}
            >
              {FONCTIONS_ETABLISSEMENT.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>

        {mdpKo ? <p className="text-sm text-red-600">Les mots de passe ne correspondent pas.</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          className="w-full"
          size="lg"
          disabled={saving || form.motDePasse.length < 8 || mdpKo}
        >
          {saving ? "Création…" : "Créer le compte"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-teal-800">
          Se connecter
        </Link>
      </p>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
