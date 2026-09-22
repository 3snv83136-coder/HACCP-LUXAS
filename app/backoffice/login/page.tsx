import { redirect } from "next/navigation";

export default function LegacyBackofficeLogin({
  searchParams,
}: {
  searchParams: { next?: string; erreur?: string };
}) {
  const qs = new URLSearchParams();
  if (searchParams.next) qs.set("next", searchParams.next);
  if (searchParams.erreur) qs.set("erreur", searchParams.erreur);
  redirect(`/acces/administrateur${qs.size ? `?${qs}` : ""}`);
}
