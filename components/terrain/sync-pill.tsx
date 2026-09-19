"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, CloudUpload } from "lucide-react";
import { listQueue } from "@/lib/offline/idb";
import { flushQueue } from "@/lib/offline/sync";
import { cn } from "@/lib/utils";

export function SyncPill() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  async function refresh() {
    const items = await listQueue();
    setPending(items.length);
  }

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => {
      setOnline(true);
      void flushQueue().then(refresh);
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    void refresh();
    const id = window.setInterval(() => void refresh(), 4000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.clearInterval(id);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => void flushQueue().then(refresh)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
        !online
          ? "bg-amber-100 text-amber-800"
          : pending > 0
            ? "bg-sky-100 text-sky-800"
            : "bg-emerald-100 text-emerald-800",
      )}
    >
      {!online ? <WifiOff className="h-3.5 w-3.5" /> : pending > 0 ? <CloudUpload className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
      {!online ? "Hors-ligne" : pending > 0 ? `${pending} en attente` : "Synchronisé"}
    </button>
  );
}
