import Link from "next/link";
import { LogoSanitrace } from "@/components/brand/logo-sanitrace";
import { InstallerApp } from "@/components/pwa/installer-app";
import { Button } from "@/components/ui/button";

export default function PageAccueilPublic() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-between px-6 py-10 sm:max-w-xl lg:max-w-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.28),_transparent_46%)]" />
      <div className="relative flex flex-1 flex-col items-center justify-center text-center">
        <LogoSanitrace size={96} secret />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-800">HACCP cuisine</p>
        <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight text-slate-900">Sanitrace</h1>
        <p className="mt-4 max-w-sm text-base text-slate-500">
          Relevés, traçabilité et dossier hygiène pour chaque établissement.
        </p>

        <div className="mt-10 grid w-full max-w-sm gap-3 rounded-3xl border border-teal-200/70 bg-white/65 p-5 shadow-sm backdrop-blur-xl">
          <Button asChild size="lg" className="w-full">
            <Link href="/connexion">Se connecter</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/creer-compte">Créer un compte</Link>
          </Button>
          <InstallerApp className="w-full" />
        </div>
      </div>
    </main>
  );
}
