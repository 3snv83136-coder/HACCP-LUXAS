"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoCapture } from "@/components/terrain/photo-capture";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { enqueueGeneric } from "@/lib/offline/sync";
import { PARAM_KEYS, requireParamNumber } from "@/lib/params";

export default function ReceptionPage() {
  const router = useRouter();
  const { session, bootstrap, refresh } = useTerrain();
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    fournisseur: "",
    blRef: "",
    produit: "",
    lot: "",
    dlc: "",
    temperature: "",
    emballageOk: true,
    estampilleOk: true,
    conforme: true,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    const temperature = form.temperature === "" ? null : Number(form.temperature.replace(",", "."));
    let conforme = form.emballageOk && form.estampilleOk && form.conforme;
    if (temperature != null && form.produit.toLowerCase().includes("surgel")) {
      const max = requireParamNumber(bootstrap.params, PARAM_KEYS.TEMP_RECEPTION_SURGELES_TOLERANCE);
      if (temperature > max) conforme = false;
    }
    const clientUuid = nanoid();
    await enqueueGeneric("reception", clientUuid, {
      clientUuid,
      etablissementId: session.etablissementId,
      codeOperateurId: session.codeOperateurId,
      ...form,
      temperature,
      conforme,
      photoUrl,
    });
    await refresh();
    setSaving(false);
    router.push("/terrain");
  }

  return (
    <form
      className="space-y-4 pb-10"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h1 className="text-2xl font-semibold text-white">Réception marchandise</h1>
      <Field label="Fournisseur">
        <Input required value={form.fournisseur} onChange={(e) => set("fournisseur", e.target.value)} />
      </Field>
      <Field label="N° BL">
        <Input value={form.blRef} onChange={(e) => set("blRef", e.target.value)} />
      </Field>
      <Field label="Produit">
        <Input required value={form.produit} onChange={(e) => set("produit", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lot">
          <Input value={form.lot} onChange={(e) => set("lot", e.target.value)} />
        </Field>
        <Field label="DLC / DLUO">
          <Input type="date" value={form.dlc} onChange={(e) => set("dlc", e.target.value)} />
        </Field>
      </div>
      <Field label="Température produit (°C)">
        <Input
          inputMode="decimal"
          value={form.temperature}
          onChange={(e) => set("temperature", e.target.value)}
          placeholder="ex. 2,4"
        />
      </Field>
      <Toggle label="Emballage intact" value={form.emballageOk} onChange={(v) => set("emballageOk", v)} />
      <Toggle label="Estampille sanitaire" value={form.estampilleOk} onChange={(v) => set("estampilleOk", v)} />
      <Toggle label="Conforme global" value={form.conforme} onChange={(v) => set("conforme", v)} />
      <PhotoCapture value={photoUrl} onChange={setPhotoUrl} label="Photo BL / étiquette" />
      <Button size="lg" className="w-full" disabled={saving}>
        {saving ? "Enregistrement…" : "Signer la réception"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
        value ? "border-emerald-400/40 bg-emerald-500/10 text-white" : "border-red-400/40 bg-red-500/10 text-white"
      }`}
    >
      {label}
      <span className="font-semibold">{value ? "OK" : "NOK"}</span>
    </button>
  );
}
