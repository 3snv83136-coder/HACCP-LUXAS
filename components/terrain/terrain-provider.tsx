"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  listQueue,
  listRelevesLocal,
  loadBootstrap,
  loadSession,
  saveBootstrap,
  saveSession,
} from "@/lib/offline/idb";
import { flushQueue } from "@/lib/offline/sync";
import { buildTachesDuJour } from "@/lib/tasks";
import type { BootstrapPayload, ReleveLocal, SessionOperateur, TacheDuJour } from "@/lib/types";
import { NumericPad } from "@/components/terrain/numeric-pad";
import { Button } from "@/components/ui/button";
import { SyncPill } from "@/components/terrain/sync-pill";
import { BackArrow } from "@/components/navigation/back-arrow";

type TerrainContextValue = {
  session: SessionOperateur;
  bootstrap: BootstrapPayload;
  releves: ReleveLocal[];
  taches: TacheDuJour[];
  pending: number;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const TerrainContext = createContext<TerrainContextValue | null>(null);

export function useTerrain() {
  const ctx = useContext(TerrainContext);
  if (!ctx) throw new Error("useTerrain hors provider");
  return ctx;
}

async function fetchBootstrap(etablissementId?: string): Promise<BootstrapPayload> {
  const qs = etablissementId ? `?etablissementId=${etablissementId}` : "";
  const res = await fetch(`/api/bootstrap${qs}`);
  if (!res.ok) throw new Error("Impossible de charger le référentiel");
  return res.json() as Promise<BootstrapPayload>;
}

function mergeReleves(server: ReleveLocal[], local: ReleveLocal[]): ReleveLocal[] {
  const map = new Map<string, ReleveLocal>();
  for (const r of server) map.set(r.clientUuid, r);
  for (const r of local) {
    const prev = map.get(r.clientUuid);
    if (!prev || prev.syncStatus !== "synced") map.set(r.clientUuid, r);
  }
  return Array.from(map.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt) * -1);
}

export function TerrainProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionOperateur | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [releves, setReleves] = useState<ReleveLocal[]>([]);
  const [pending, setPending] = useState(0);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const hydrate = useCallback(async (current: SessionOperateur) => {
    const cached = await loadBootstrap(current.etablissementId);
    if (cached) setBootstrap(cached);
    try {
      const fresh = await fetchBootstrap(current.etablissementId);
      await saveBootstrap(fresh);
      setBootstrap(fresh);
      const local = await listRelevesLocal();
      setReleves(mergeReleves(fresh.relevesRecents, local));
    } catch {
      if (cached) {
        const local = await listRelevesLocal();
        setReleves(mergeReleves(cached.relevesRecents, local));
      }
    }
    setPending((await listQueue()).length);
  }, []);

  useEffect(() => {
    void (async () => {
      const existing = await loadSession();
      if (existing) {
        setSession(existing);
        await hydrate(existing);
      }
      setLoading(false);
    })();
  }, [hydrate]);

  async function submitPin() {
    if (pin.length !== 4) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pin }),
      });
      const data = (await res.json()) as { session?: SessionOperateur; error?: string };
      if (!res.ok || !data.session) {
        setError(data.error ?? "Code incorrect");
        setPin("");
        return;
      }
      await saveSession(data.session);
      setSession(data.session);
      await hydrate(data.session);
      setPin("");
    } catch {
      setError("Hors-ligne : impossible de vérifier le code pour le moment.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (pin.length === 4 && !submitting) void submitPin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const refresh = useCallback(async () => {
    if (!session) return;
    await flushQueue();
    await hydrate(session);
  }, [hydrate, session]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await clearSession();
    setSession(null);
    setBootstrap(null);
    setReleves([]);
  }, []);

  const taches = useMemo(() => {
    if (!bootstrap) return [];
    return buildTachesDuJour(bootstrap, releves);
  }, [bootstrap, releves]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="px-4 py-3">
          <BackArrow />
        </div>
        <div className="flex flex-1 items-center justify-center text-slate-500">Chargement…</div>
      </div>
    );
  }

  if (!session || !bootstrap) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between px-5 py-8">
        <div>
          <BackArrow />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
            Sanitrace · terrain
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Ton code</h1>
          <p className="mt-2 text-sm text-slate-500">
            Signature personnelle. Chaque relevé restera horodaté à ton nom.
          </p>
          <p className="mt-8 text-center font-mono text-5xl tracking-[0.4em] text-slate-900">
            {pin.padEnd(4, "•")}
          </p>
          {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="space-y-4">
          <NumericPad
            value={pin}
            onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 4))}
            allowDecimal={false}
            allowNegative={false}
            maxLength={4}
          />
          <Button className="w-full" size="lg" disabled={pin.length !== 4 || submitting} onClick={() => void submitPin()}>
            {submitting ? "Vérification…" : "Entrer"}
          </Button>
        </div>
      </div>
    );
  }

  const value: TerrainContextValue = {
    session,
    bootstrap,
    releves,
    taches,
    pending,
    refresh,
    signOut,
  };

  return (
    <TerrainContext.Provider value={value}>
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <BackArrow />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-teal-700">Sanitrace</p>
              <p className="truncate text-sm font-medium text-slate-900">
                {session.prenom} · {session.etablissementNom}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SyncPill />
            <button type="button" onClick={() => void signOut()} className="text-xs text-slate-400">
              Quitter
            </button>
          </div>
        </header>
        <div className="flex-1 px-4 py-4">{children}</div>
      </div>
    </TerrainContext.Provider>
  );
}
