"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { BackArrow } from "@/components/navigation/back-arrow";
import { BrandLogo } from "@/components/brand/logo";

const erreurs: Record<string, string> = {
  code: "Code incorrect. Tape 1470 ou 3690, quatre chiffres.",
  role: "Ce code n’ouvre pas le back-office.",
  etab: "Établissement introuvable.",
};

function LoginForm() {
  const params = useSearchParams();
  const erreur = params.get("erreur");
  const [code, setCode] = useState("");

  return (
    <form
      action="/api/auth/backoffice"
      method="POST"
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6"
    >
      <BackArrow />
      <BrandLogo size={120} className="mt-6 rounded-3xl" />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Le Zinc Bouillon</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900">Back-office</h1>
      <p className="mt-2 text-sm text-slate-500">Code responsable 1470 ou gérant 3690.</p>
      <input type="hidden" name="next" value={params.get("next") || "/backoffice"} />
      <input
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="mt-8 h-14 w-full rounded-2xl border border-slate-200 px-4 text-center font-mono text-3xl tracking-[0.4em]"
        aria-label="Code back-office"
      />
      {erreur ? <p className="mt-3 text-sm text-red-600">{erreurs[erreur] ?? "Connexion impossible."}</p> : null}
      <Button className="mt-6 w-full" size="lg" disabled={code.length !== 4}>
        Entrer
      </Button>
    </form>
  );
}

export default function BackofficeLoginPage() {
  return (
    <Suspense fallback={<p className="p-6 text-slate-500">Chargement…</p>}>
      <LoginForm />
    </Suspense>
  );
}
