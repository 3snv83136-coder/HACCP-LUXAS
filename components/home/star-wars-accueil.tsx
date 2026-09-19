"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pathway_Gothic_One } from "next/font/google";
import { Volume2, VolumeX } from "lucide-react";
import { playOuvertureGalactique } from "@/lib/home/fanfare";

const crawlFont = Pathway_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

const etoiles = Array.from({ length: 140 }, (_, i) => ({
  left: `${(i * 67) % 100}%`,
  top: `${(i * 41 + 7) % 100}%`,
  size: i % 9 === 0 ? 3 : i % 4 === 0 ? 2 : 1,
  delay: `${(i % 8) * 0.35}s`,
}));

export function StarWarsAccueil() {
  const [fini, setFini] = useState(false);
  const [son, setSon] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const stars = useMemo(() => etoiles, []);

  function couperSon() {
    stopRef.current?.();
    stopRef.current = null;
    setSon(false);
  }

  function lancerSon() {
    couperSon();
    stopRef.current = playOuvertureGalactique();
    setSon(true);
  }

  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (fini) couperSon();
  }, [fini]);

  return (
    <main className={`${crawlFont.className} relative min-h-dvh overflow-hidden bg-black text-[#ffe81f]`}>
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s, i) => (
          <span
            key={i}
            className="sw-star absolute rounded-full bg-white"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => (son ? couperSon() : lancerSon())}
        className="absolute right-4 top-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-[#ffe81f]/50 px-3 text-[11px] uppercase tracking-[0.22em] text-[#ffe81f]"
        aria-label={son ? "Couper la musique" : "Lancer la musique"}
      >
        {son ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        {son ? "Son" : "Musique"}
      </button>

      {!fini ? (
        <>
          <p className="sw-blue pointer-events-none absolute inset-x-6 top-[38%] z-10 text-center text-xl leading-relaxed text-[#4bd5ee] sm:text-3xl">
            Il y a longtemps, dans une cuisine
            <br />
            pas si lointaine…
          </p>

          <div className="sw-logo pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
            <p className="text-[clamp(3.2rem,14vw,9rem)] font-bold leading-none tracking-[0.18em] text-[#ffe81f] [text-shadow:0_0_24px_rgba(255,232,31,0.35)]">
              LE ZINC
            </p>
            <p className="mt-2 text-[clamp(1.4rem,6vw,3.5rem)] tracking-[0.55em] text-[#ffe81f]">
              BOUILLON
            </p>
          </div>

          <div className="sw-perspective z-20">
            <div className="sw-crawl text-[clamp(1.2rem,4.1vw,2.15rem)] font-bold leading-[1.45] tracking-wide">
              <p className="mb-5 text-center uppercase">Épisode I</p>
              <p className="mb-8 text-center text-[1.15em] uppercase tracking-[0.12em]">Arnaud</p>
              <p className="mb-6">Je suis ton père.</p>
              <p className="mb-8">
                Tu es l’enfant du Zinc de Toulon et roi de la galaxie du centre-ville.
              </p>
              <p className="mb-6">
                La paix n’a jamais duré longtemps dans la rade. Sur le port, des cantinas juraient
                servir des moules « comme à la maison », alors que la maison n’avait jamais vu un
                moule de sa vie. Place de la Liberté, les terrasses se tiraient dessus à coups de
                formules du midi, chacune prétendant détenir le seul vrai aïoli de la galaxie.
              </p>
              <p className="mb-6">
                Au Mourillon, le sable s’invitait dans les frites comme une épice secrète. À Mayol,
                on mangeait plus fort qu’on ne jouait. Cours Lafayette, la panisse et la pizza
                signaient un armistice toutes les cinq minutes… puis recommençaient.
              </p>
              <p className="mb-6">
                Les seigneurs du centre-ville croyaient régner, entre salades tièdes et serveurs
                Jedi de l’addition. Ils n’avaient pas prévu l’enfant du Zinc : souverain du
                bouillon, protecteur des tablées, empereur du service qui arrive avant le pain.
              </p>
              <p>Que les assiettes soient avec lui.</p>
            </div>
          </div>
        </>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16">
        {!fini ? (
          <button
            type="button"
            onClick={() => setFini(true)}
            className="text-xs uppercase tracking-[0.35em] text-[#ffe81f]/70 hover:text-[#ffe81f]"
          >
            Passer le générique
          </button>
        ) : (
          <p className="max-w-md text-center text-sm uppercase tracking-[0.2em] text-[#ffe81f]">
            Arnaud, je suis ton père. Tu es l’enfant du Zinc de Toulon et roi de la galaxie du
            centre-ville.
          </p>
        )}
        <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
          <Link
            href="/terrain"
            className="flex-1 rounded-full border-2 border-[#ffe81f] px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#ffe81f] hover:bg-[#ffe81f] hover:text-black"
          >
            Terrain
          </Link>
          <Link
            href="/backoffice"
            className="flex-1 rounded-full border-2 border-[#4bd5ee] px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#4bd5ee] hover:bg-[#4bd5ee] hover:text-black"
          >
            Back-office
          </Link>
        </div>
      </div>
    </main>
  );
}
