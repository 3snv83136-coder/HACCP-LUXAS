import { Suspense } from "react";
import { CreateursConnexionForm } from "./connexion-form";

export default function CreateursConnexionPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-zinc-400">Chargement…</p>}>
      <CreateursConnexionForm />
    </Suspense>
  );
}
