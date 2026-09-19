import { NextResponse } from "next/server";
import { applyQueueItem } from "@/lib/server/apply-sync";
import type { QueueItem } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { items?: QueueItem[] };
  const items = body.items ?? [];
  const accepted: string[] = [];
  const rejected: { id: string; error: string }[] = [];

  for (const item of items) {
    try {
      await applyQueueItem(item);
      accepted.push(item.id);
    } catch (error) {
      rejected.push({
        id: item.id,
        error: error instanceof Error ? error.message : "Erreur de synchro",
      });
    }
  }

  return NextResponse.json({ accepted, rejected });
}
