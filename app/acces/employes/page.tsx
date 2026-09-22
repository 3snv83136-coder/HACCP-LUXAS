import { AccesPin } from "@/components/acces/acces-pin";

export default function AccesEmployesPage() {
  return (
    <AccesPin
      titre="Accès employés"
      sousTitre="Identifie ton établissement, puis signe avec ton code personnel."
      destination="/terrain"
      mode="employes"
    />
  );
}
