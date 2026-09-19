"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { BackArrow } from "@/components/navigation/back-arrow";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await res.json()) as { session?: { role: string }; error?: string };
    if (!res.ok || !data.session) {
      setError(data.error ?? "Code incorrect");
      setLoading(false);
      return;
    }
    if (data.session.role !== "responsable" && data.session.role !== "gerant") {
      setError("Ce code n’ouvre pas le back-office.");
      setLoading(false);
      return;
    }
    router.replace(params.get("next") || "/backoffice");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <BackArrow />
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Sanitrace</p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-900">Back-office</h1>
      <p className="mt-2 text-sm text-slate-500">Code responsable ou gérant, 4 chiffres.</p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="mt-8 h-14 w-full rounded-2xl border border-slate-200 px-4 text-center font-mono text-3xl tracking-[0.4em]"
        aria-label="Code back-office"
      />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <Button className="mt-6 w-full" size="lg" disabled={code.length !== 4 || loading}>
        {loading ? "Vérification…" : "Entrer"}
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
