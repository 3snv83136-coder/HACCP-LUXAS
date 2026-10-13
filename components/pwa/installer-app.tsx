"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallerApp({ className }: { className?: string }) {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installe, setInstalle] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && Boolean((window.navigator as { standalone?: boolean }).standalone));
    if (standalone) setInstalle(true);

    function onPrompt(e: Event) {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function installer() {
    if (event) {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") setInstalle(true);
      setEvent(null);
      return;
    }
    window.alert(
      "Pour installer Sanitrace : menu du navigateur → « Ajouter à l’écran d’accueil » ou « Installer l’application ».",
    );
  }

  if (installe) return null;

  return (
    <Button type="button" variant="outline" className={className} onClick={() => void installer()}>
      Installer l’application sur mon téléphone
    </Button>
  );
}
