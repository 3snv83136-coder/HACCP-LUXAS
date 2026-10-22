"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { NumericPad } from "@/components/terrain/numeric-pad";
import { Button } from "@/components/ui/button";
import { BackArrow } from "@/components/navigation/back-arrow";
import { BrandLogo } from "@/components/brand/logo";

export function BackofficePinGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/backoffice-pin")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/connexion?next=/backoffice");
          return;
        }
        const data = (await res.json()) as { ok?: boolean };
        setOk(Boolean(data.ok));
      })
      .catch(() => setOk(false));
  }, [router]);

  async function valider(code = pin) {
    if (code.length !== 4) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/backoffice-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Code incorrect");
      setPin("");
      return;
    }
    setOk(true);
  }

  useEffect(() => {
    if (pin.length === 4 && !saving && ok === false) void valider(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (ok === null) {
    return <p className="p-8 text-sm text-slate-500">Vérification de l’accès…</p>;
  }

  if (!ok) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
        <BackArrow />
        <BrandLogo size={56} className="mt-8" />
        <h1 className="mt-4 font-serif text-3xl font-semibold text-slate-900">Back-office</h1>
        <p className="mt-2 text-sm text-slate-500">Code à 4 chiffres de la gérance.</p>
        <p className="mt-8 text-center font-mono text-5xl tracking-[0.4em] text-slate-900">{pin.padEnd(4, "•")}</p>
        {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
        <div className="mt-8 space-y-4">
          <NumericPad
            value={pin}
            onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}
            allowDecimal={false}
            allowNegative={false}
            maxLength={4}
          />
          <Button className="w-full" size="lg" disabled={pin.length !== 4 || saving} onClick={() => void valider()}>
            {saving ? "Vérification…" : "Entrer"}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
