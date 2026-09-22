"use client";

import { useRouter } from "next/navigation";

export function TitreAccesSecret() {
  const router = useRouter();

  return (
    <h1
      className="mt-5 cursor-default font-serif text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl"
      onClick={() => router.push("/createurs")}
    >
      Le contrôle sanitaire, prêt pour un inspecteur.
    </h1>
  );
}

export function MarqueAccesSecret() {
  const router = useRouter();

  return (
    <p
      className="cursor-default text-xs font-semibold uppercase tracking-[0.24em] text-teal-700"
      onClick={() => router.push("/createurs")}
    >
      Sanitrace
    </p>
  );
}
