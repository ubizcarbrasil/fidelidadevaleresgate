(window as any).__BOOT_PHASE__ = "MAIN_MODULE_START";
console.info("[boot] MAIN_MODULE_START");

import "./index.css";
import { setBootPhase } from "@/lib/bootStateCore";
import { createRoot } from "react-dom/client";
import App from "./App";

setBootPhase("BOOTSTRAP");

const rootEl = document.getElementById("root");
if (!rootEl) {
  console.error("[boot] #root não encontrado");
} else {
  const root = createRoot(rootEl);

  // Renderiza App diretamente — o bootstrap overlay será
  // dismissado pelo MountSignal dentro do App quando estiver pronto
  root.render(<App />);
}
