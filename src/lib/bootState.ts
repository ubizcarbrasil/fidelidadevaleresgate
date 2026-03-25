export type BootPhase =
  | "BOOTSTRAP"
  | "AUTH_LOADING"
  | "AUTH_READY"
  | "BRAND_LOADING"
  | "BRAND_READY"
  | "APP_MOUNTED"
  | "FAILED";

let currentPhase: BootPhase = "BOOTSTRAP";
const listeners: Array<(phase: BootPhase) => void> = [];

export function dismissBootstrap() {
  const el = document.getElementById("bootstrap-fallback");
  if (el) el.style.display = "none";
}

export function setBootPhase(phase: BootPhase, detail?: string) {
  currentPhase = phase;
  (window as any).__BOOT_PHASE__ = phase;
  const ts = (performance.now() / 1000).toFixed(2);
  console.info(`[boot] ${ts}s → ${phase}${detail ? ` (${detail})` : ""}`);
  listeners.forEach((fn) => fn(phase));

  if (phase === "APP_MOUNTED" || phase === "FAILED") {
    dismissBootstrap();
  }
}

export function getBootPhase(): BootPhase {
  return currentPhase;
}

export function onBootPhase(fn: (phase: BootPhase) => void) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}
