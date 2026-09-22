import { AccesPin } from "@/components/acces/acces-pin";

export default function AccesAdminPage() {
  return (
    <AccesPin
      titre="Accès administrateur"
      sousTitre="Gérant ou responsable : équipe, équipements et paramétrage."
      destination="/backoffice"
      mode="admin"
    />
  );
}
