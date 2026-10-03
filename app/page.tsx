import { Suspense } from "react";
import { ConnexionForm } from "./connexion/connexion-form";

export default function PageConnexion() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-slate-500">Chargement…</p>}>
      <ConnexionForm />
    </Suspense>
  );
}
