"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackArrow } from "@/components/navigation/back-arrow";

export default function CreerComptePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    nomEtablissement: "",
    adresse: "",
    email: "",
    telephone: "",
    typeCuisine: "restauration_commerciale",
    prenom: "",
    nom: "",
    code: "",
  });

  async function onLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 320;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setLogoUrl(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function creer(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, logoUrl }),
    });
    const data = (await res.json()) as { error?: string; slug?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Inscription impossible");
      return;
    }
    if (data.slug) localStorage.setItem("sanitrace_identifiant", data.slug);
    router.replace("/backoffice");
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-6 py-10">
      <BackArrow />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Sanitrace</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900">Créer le compte établissement</h1>
      <p className="mt-2 text-sm text-slate-500">
        Un espace isolé pour ton restaurant : employés, équipements et dossier hygiène.
      </p>

      <form className="mt-8 space-y-4" onSubmit={(e) => void creer(e)}>
        <Field label="Nom de l’établissement">
          <Input
            required
            value={form.nomEtablissement}
            onChange={(e) => setForm({ ...form, nomEtablissement: e.target.value })}
          />
        </Field>
        <Field label="Adresse">
          <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="E-mail professionnel">
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Téléphone">
            <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          </Field>
        </div>
        <Field label="Type de cuisine">
          <select
            className="h-12 w-full rounded-2xl border border-slate-200 px-3"
            value={form.typeCuisine}
            onChange={(e) => setForm({ ...form, typeCuisine: e.target.value })}
          >
            <option value="restauration_commerciale">Restauration commerciale</option>
            <option value="brasserie">Brasserie</option>
            <option value="traiteur">Traiteur</option>
            <option value="collectivite">Collectivité</option>
          </select>
        </Field>
        <label className="block space-y-2">
          <Label>Logo</Label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onLogo(file);
            }}
          />
          {logoUrl ? (
            // Logo compressé en data URL pour le compte établissement.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo établissement" className="h-20 w-20 rounded-2xl object-cover" />
          ) : null}
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Prénom du gérant">
            <Input required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          </Field>
          <Field label="Nom du gérant">
            <Input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </Field>
        </div>
        <Field label="Code administrateur (4 chiffres)">
          <Input
            inputMode="numeric"
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
        </Field>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full" size="lg" disabled={saving || form.code.length !== 4}>
          {saving ? "Création…" : "Créer le compte"}
        </Button>
      </form>
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
