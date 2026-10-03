"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccesDashboardFormProps = {
  variant?: "clair" | "sombre";
};

export function AccesDashboardForm({ variant = "clair" }: AccesDashboardFormProps) {
  const sombre = variant === "sombre";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/createurs/acces")
      .then(async (res) => {
        const data = (await res.json()) as { email?: string; error?: string };
        if (res.ok && data.email) setEmail(data.email);
        else setError(data.error ?? "Impossible de charger l’accès");
      })
      .finally(() => setLoading(false));
  }, []);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    if (code && code !== confirmation) {
      setError("Les deux codes ne correspondent pas");
      setSaving(false);
      return;
    }
    const res = await fetch("/api/createurs/acces", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: code || undefined }),
    });
    const data = (await res.json()) as { error?: string; email?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Mise à jour impossible");
      return;
    }
    if (data.email) setEmail(data.email);
    setCode("");
    setConfirmation("");
    setMessage("Accès dashboard mis à jour.");
  }

  if (loading) {
    return <p className={sombre ? "text-sm text-zinc-500" : "text-sm text-slate-500"}>Chargement de l’accès…</p>;
  }

  return (
    <form
      className={
        sombre
          ? "space-y-4 rounded-3xl border border-white/10 bg-black/40 p-5"
          : "space-y-4 rounded-3xl border border-slate-200 bg-white p-5"
      }
      onSubmit={(e) => void enregistrer(e)}
    >
      <div>
        <p
          className={
            sombre
              ? "font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300/80"
              : "text-xs font-semibold uppercase tracking-[0.2em] text-teal-700"
          }
        >
          Accès dashboard
        </p>
        <h2 className={sombre ? "mt-1 font-serif text-xl text-white" : "mt-1 font-serif text-xl font-semibold"}>
          E-mail et code
        </h2>
        <p className={sombre ? "mt-1 text-sm text-zinc-400" : "mt-1 text-sm text-slate-500"}>
          Ces identifiants ouvrent le dashboard. Laisse le code vide pour ne changer que l’e-mail.
        </p>
      </div>
      <label className="block space-y-1.5">
        <Label className={sombre ? "text-zinc-300" : undefined}>E-mail</Label>
        <Input
          className={sombre ? "border-white/15 bg-black/40 text-white" : undefined}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <Label className={sombre ? "text-zinc-300" : undefined}>Nouveau code</Label>
        <Input
          className={sombre ? "border-white/15 bg-black/40 text-white" : undefined}
          type="password"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Inchangé si vide"
        />
      </label>
      <label className="block space-y-1.5">
        <Label className={sombre ? "text-zinc-300" : undefined}>Confirmer le code</Label>
        <Input
          className={sombre ? "border-white/15 bg-black/40 text-white" : undefined}
          type="password"
          inputMode="numeric"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
      </label>
      {error ? <p className={sombre ? "text-sm text-red-400" : "text-sm text-red-600"}>{error}</p> : null}
      {message ? <p className={sombre ? "text-sm text-emerald-300" : "text-sm text-emerald-700"}>{message}</p> : null}
      <Button
        className={sombre ? "bg-amber-300 text-black hover:bg-amber-200" : undefined}
        disabled={saving || !email}
      >
        {saving ? "Enregistrement…" : "Enregistrer l’accès"}
      </Button>
    </form>
  );
}
