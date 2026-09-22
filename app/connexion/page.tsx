import { Suspense } from "react";
import { ConnexionForm } from "./connexion-form";

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" />}>
      <ConnexionForm />
    </Suspense>
  );
}
