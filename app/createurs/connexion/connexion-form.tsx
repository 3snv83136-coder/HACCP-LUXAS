"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackArrow } from "@/components/navigation/back-arrow";
import { BrandLogo } from "@/components/brand/logo";

export function CreateursConnexionForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/createurs/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
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
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">
          Sanitrace · Q.G.
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-white">Connexion</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Entre le code d’accès pour ouvrir le dashboard super administrateur.
        </p>

        <form className="mt-8 space-y-4" onSubmit={(e) => void envoyer(e)}>
          <label className="block space-y-1.5">
            <Label className="text-zinc-300">Code d’accès</Label>
            <Input
              className="border-white/15 bg-black/40 text-white"
              type="password"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button className="w-full bg-amber-300 text-black hover:bg-amber-200" size="lg" disabled={saving}>
            {saving ? "Vérification…" : "Entrer"}
          </Button>
        </form>
      </div>
    </main>
  );
}
