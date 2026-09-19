import type { QueueItem, SessionOperateur } from "@/lib/types";
import {
  listQueue,
  markQueueError,
  removeQueueItem,
  saveReleveLocal,
} from "@/lib/offline/idb";

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const items = await listQueue();
  if (items.length === 0) return { synced: 0, failed: 0 };

  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      throw new Error(`Sync HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      accepted: string[];
      rejected: { id: string; error: string }[];
    };

    for (const id of data.accepted) {
      await removeQueueItem(id);
    }
    for (const rej of data.rejected) {
      await markQueueError(rej.id, rej.error);
    }
    return { synced: data.accepted.length, failed: data.rejected.length };
  } catch {
    return { synced: 0, failed: items.length };
  }
}

export async function enqueueReleve(input: {
  session: SessionOperateur;
  clientUuid: string;
  equipementId?: string | null;
  pointControleId?: string | null;
  valeur: number;
  conforme: boolean;
  methode: string;
  note?: string | null;
}) {
  const createdAt = new Date().toISOString();
  const item: QueueItem = {
    id: input.clientUuid,
    kind: "releve_temperature",
    createdAt,
    status: "pending",
    payload: {
      clientUuid: input.clientUuid,
      etablissementId: input.session.etablissementId,
      equipementId: input.equipementId ?? null,
      pointControleId: input.pointControleId ?? null,
      valeur: input.valeur,
      conforme: input.conforme,
      methode: input.methode,
      codeOperateurId: input.session.codeOperateurId,
      note: input.note ?? null,
      auteurNom: `${input.session.prenom} ${input.session.nom}`,
    },
  };

  const { enqueue } = await import("@/lib/offline/idb");
  await enqueue(item);
  await saveReleveLocal({
    id: input.clientUuid,
    clientUuid: input.clientUuid,
    etablissementId: input.session.etablissementId,
    equipementId: input.equipementId ?? null,
    pointControleId: input.pointControleId ?? null,
    valeur: input.valeur,
    conforme: input.conforme,
    methode: input.methode,
    codeOperateurId: input.session.codeOperateurId,
    note: input.note ?? null,
    createdAt,
    syncStatus: "pending",
    auteurNom: `${input.session.prenom} ${input.session.nom}`,
  });

  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flushQueue();
  }
}

export async function enqueueGeneric(
  kind: QueueItem["kind"],
  clientUuid: string,
  payload: Record<string, unknown>,
) {
  const { enqueue } = await import("@/lib/offline/idb");
  await enqueue({
    id: clientUuid,
    kind,
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
  });
  if (typeof navigator !== "undefined" && navigator.onLine) {
    void flushQueue();
  }
}
