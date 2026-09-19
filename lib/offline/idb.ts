import { openDB, type IDBPDatabase } from "idb";
import type {
  BootstrapPayload,
  QueueItem,
  ReleveLocal,
  SessionOperateur,
} from "@/lib/types";

const DB_NAME = "sanitrace";
const DB_VERSION = 1;

type SanitraceDB = {
  session: { key: string; value: SessionOperateur };
  bootstrap: { key: string; value: BootstrapPayload };
  queue: { key: string; value: QueueItem };
  releves: { key: string; value: ReleveLocal };
};

let dbPromise: Promise<IDBPDatabase<SanitraceDB>> | null = null;

function getDb() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB n'est disponible que dans le navigateur");
  }
  if (!dbPromise) {
    dbPromise = openDB<SanitraceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("session")) db.createObjectStore("session");
        if (!db.objectStoreNames.contains("bootstrap")) db.createObjectStore("bootstrap");
        if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue");
        if (!db.objectStoreNames.contains("releves")) db.createObjectStore("releves");
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: SessionOperateur) {
  const db = await getDb();
  await db.put("session", session, "current");
}

export async function loadSession(): Promise<SessionOperateur | null> {
  const db = await getDb();
  return (await db.get("session", "current")) ?? null;
}

export async function clearSession() {
  const db = await getDb();
  await db.delete("session", "current");
}

export async function saveBootstrap(payload: BootstrapPayload) {
  const db = await getDb();
  await db.put("bootstrap", payload, payload.etablissement.id);
}

export async function loadBootstrap(
  etablissementId: string,
): Promise<BootstrapPayload | null> {
  const db = await getDb();
  return (await db.get("bootstrap", etablissementId)) ?? null;
}

export async function enqueue(item: QueueItem) {
  const db = await getDb();
  await db.put("queue", item, item.id);
}

export async function listQueue(): Promise<QueueItem[]> {
  const db = await getDb();
  const items = await db.getAll("queue");
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removeQueueItem(id: string) {
  const db = await getDb();
  await db.delete("queue", id);
}

export async function markQueueError(id: string, error: string) {
  const db = await getDb();
  const item = await db.get("queue", id);
  if (!item) return;
  await db.put("queue", { ...item, status: "error", error }, id);
}

export async function saveReleveLocal(releve: ReleveLocal) {
  const db = await getDb();
  await db.put("releves", releve, releve.clientUuid);
}

export async function listRelevesLocal(): Promise<ReleveLocal[]> {
  const db = await getDb();
  const items = await db.getAll("releves");
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
