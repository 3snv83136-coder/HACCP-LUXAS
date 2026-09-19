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
import { SyncPill } from "@/components/terrain/sync-pill";

type TerrainContextValue = {
  session: SessionOperateur;
  bootstrap: BootstrapPayload;
  releves: ReleveLocal[];
  taches: TacheDuJour[];
  pending: number;
  refresh: () => Promise<void>;
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
  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function TerrainProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionOperateur | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [releves, setReleves] = useState<ReleveLocal[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      try {
        let current = await loadSession();
        if (!current) {
          const res = await fetch("/api/auth/training");
          const data = (await res.json()) as { session?: SessionOperateur; error?: string };
          if (!res.ok || !data.session) {
            setError(data.error ?? "Impossible d’ouvrir la session d’entraînement.");
            setLoading(false);
            return;
          }
          current = data.session;
          await saveSession(current);
        }
        setSession(current);
        await hydrate(current);
      } catch {
        setError("Connexion impossible. Réessaie dans un instant.");
      } finally {
        setLoading(false);
      }
    })();
  }, [hydrate]);

  const refresh = useCallback(async () => {
    if (!session) return;
    await flushQueue();
    await hydrate(session);
  }, [hydrate, session]);

  const taches = useMemo(() => {
    if (!bootstrap) return [];
    return buildTachesDuJour(bootstrap, releves);
  }, [bootstrap, releves]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-500">Chargement…</div>
    );
  }

  if (!session || !bootstrap) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-5 text-center text-slate-600">
        {error ?? "Prépare la base (npx prisma db seed) puis recharge."}
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
  };

  return (
    <TerrainContext.Provider value={value}>
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-teal-700">Sanitrace · entraînement</p>
            <p className="text-sm font-medium text-slate-900">
              {session.prenom} · {session.etablissementNom}
            </p>
          </div>
          <SyncPill />
        </header>
        <div className="flex-1 px-4 py-4">{children}</div>
      </div>
    </TerrainContext.Provider>
  );
}
