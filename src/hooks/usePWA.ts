import { useState, useEffect, useCallback } from "react";
import { clearRuntimeCaches } from "@/lib/pwaRecovery";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      setRegistration(reg);

      const checkWaiting = () => {
        if (reg.waiting) setNeedRefresh(true);
      };

      checkWaiting();

      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            setNeedRefresh(true);
          }
        });
      });

      // Check for updates every hour
      const interval = setInterval(() => reg.update(), 60 * 60 * 1000);
      return () => clearInterval(interval);
    });
  }, []);

  useEffect(() => {
    void clearRuntimeCaches();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    const waiting = registration?.waiting;
    if (!waiting) {
      void clearRuntimeCaches().then(() => window.location.reload());
      return;
    }
    waiting.postMessage({ type: "SKIP_WAITING" });
    void clearRuntimeCaches().then(() => window.location.reload());
  }, [registration]);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => setInstallDismissed(true), []);
  const dismissUpdate = useCallback(() => setNeedRefresh(false), []);

  return {
    needRefresh,
    updateServiceWorker,
    dismissUpdate,
    canInstall: canInstall && !installDismissed,
    installApp,
    dismissInstall,
  };
}
