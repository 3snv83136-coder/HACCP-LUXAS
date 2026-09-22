import { AccesPin } from "@/components/acces/acces-pin";

export default function AccesHygienePage() {
  return (
    <AccesPin
      titre="Accès hygiène"
      sousTitre="Dossier de contrôle et export PDF filtré. Code gérant ou responsable."
      destination="/hygiene"
      mode="admin"
    />
  );
}
