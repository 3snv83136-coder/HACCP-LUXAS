import { Suspense } from "react";
import { StationImpressionClient } from "./station-client";

export default function StationImpressionPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-slate-500">Chargement de l’imprimante…</p>}>
      <StationImpressionClient />
    </Suspense>
  );
}
