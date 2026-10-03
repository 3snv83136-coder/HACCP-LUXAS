"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo, SanitraceNom } from "@/components/brand/logo";

export function ConnexionForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(search.get("erreur"));
  const [saving, setSaving] = useState(false);

  async function connecter(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <BrandLogo size={72} />
      <SanitraceNom className="mt-4" />
      <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900">Connexion</h1>
      <p className="mt-2 text-sm text-slate-500">E-mail et code pour entrer dans Sanitrace.</p>

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
          <Label>Code</Label>
          <Input
            type="password"
            required
            inputMode="numeric"
            autoComplete="current-password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full" size="lg" disabled={saving || !email || code.length < 4}>
          {saving ? "Connexion…" : "Entrer"}
        </Button>
      </form>
    </main>
  );
}
