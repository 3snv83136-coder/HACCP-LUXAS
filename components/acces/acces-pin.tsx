"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackArrow } from "@/components/navigation/back-arrow";

const erreurs: Record<string, string> = {
  code: "Code incorrect.",
  role: "Ce code n’ouvre pas cet accès.",
  etab: "Établissement introuvable. Utilise le slug ou l’e-mail du compte.",
};

type Props = {
  titre: string;
  sousTitre: string;
  destination: string;
  mode: "employes" | "admin";
};

function FormInner({ titre, sousTitre, destination, mode }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [identifiant, setIdentifiant] = useState(params.get("identifiant") ?? "");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState(params.get("erreur"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (identifiant) return;
    const saved = localStorage.getItem("sanitrace_identifiant");
    if (saved) setIdentifiant(saved);
  }, [identifiant]);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur(null);
    if (mode === "admin") {
      const form = e.target as HTMLFormElement;
      form.submit();
      return;
    }
    const res = await fetch("/api/auth/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiant, code }),
    });
    const data = (await res.json()) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setErreur(data.error ?? "code");
      return;
    }
    if (identifiant) localStorage.setItem("sanitrace_identifiant", identifiant);
    router.replace(destination);
    router.refresh();
  }

  return (
    <form
      action={mode === "admin" ? "/api/auth/backoffice" : undefined}
      method={mode === "admin" ? "POST" : undefined}
      onSubmit={(e) => void envoyer(e)}
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6"
    >
      <BackArrow />
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Sanitrace</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900">{titre}</h1>
      <p className="mt-2 text-sm text-slate-500">{sousTitre}</p>
      <input type="hidden" name="next" value={params.get("next") || destination} />
      <label className="mt-8 block text-sm font-medium text-slate-700">
        Établissement (slug ou e-mail)
        <Input
          name="identifiant"
          required
          value={identifiant}
          onChange={(e) => setIdentifiant(e.target.value)}
          className="mt-2"
          placeholder="ex. le-zinc-ab12 ou cuisine@resto.fr"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Code à 4 chiffres
        <input
          name="code"
          inputMode="numeric"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="mt-2 h-14 w-full rounded-2xl border border-slate-200 px-4 text-center font-mono text-3xl tracking-[0.4em]"
          aria-label="Code"
        />
      </label>
      {erreur ? <p className="mt-3 text-sm text-red-600">{erreurs[erreur] ?? erreur}</p> : null}
      <Button className="mt-6 w-full" size="lg" disabled={code.length !== 4 || !identifiant || loading}>
        {loading ? "Connexion…" : "Entrer"}
      </Button>
      <Link href="/" className="mt-6 text-center text-sm text-slate-500">
        Retour à l’accueil
      </Link>
    </form>
  );
}

export function AccesPin(props: Props) {
  return (
    <Suspense fallback={<p className="p-6 text-slate-500">Chargement…</p>}>
      <FormInner {...props} />
    </Suspense>
  );
}
