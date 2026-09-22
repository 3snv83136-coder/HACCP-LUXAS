import { Suspense } from "react";
import { CreateursConnexionForm } from "./connexion-form";

export default function CreateursConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" />}>
      <CreateursConnexionForm />
    </Suspense>
  );
}
