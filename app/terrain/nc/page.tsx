"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PhotoCapture } from "@/components/terrain/photo-capture";
import { useTerrain } from "@/components/terrain/terrain-provider";
import { enqueueGeneric } from "@/lib/offline/sync";

export default function NcPage() {
  const router = useRouter();
  const { session, refresh } = useTerrain();
  const [constat, setConstat] = useState("");
  const [actionImmediate, setActionImmediate] = useState("");
  const [gravite, setGravite] = useState("moyenne");
  const [preuveUrl, setPreuveUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    await enqueueGeneric("non_conformite", nanoid(), {
      etablissementId: session.etablissementId,
      constat,
      gravite,
      actionImmediate,
      preuveUrl,
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
      <h1 className="text-2xl font-semibold text-white">Signaler une non-conformité</h1>
      <label className="block space-y-2">
        <Label>Constat</Label>
        <textarea
          required
          value={constat}
          onChange={(e) => setConstat(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white"
        />
      </label>
      <label className="block space-y-2">
        <Label>Action corrective immédiate</Label>
        <textarea
          value={actionImmediate}
          onChange={(e) => setActionImmediate(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white"
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        {["basse", "moyenne", "haute"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGravite(g)}
            className={`rounded-2xl border py-3 text-sm capitalize ${
              gravite === g ? "border-amber-400 bg-amber-400/10 text-white" : "border-white/10 text-white/50"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <PhotoCapture value={preuveUrl} onChange={setPreuveUrl} label="Preuve photo" />
      <Button className="w-full" size="lg" disabled={saving || !constat}>
        Envoyer
      </Button>
    </form>
  );
}
