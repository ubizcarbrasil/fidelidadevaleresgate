/**
 * Entry client — Vite uses this as the static entry point.
 * Marks boot phase then imports main.tsx.
 */
(window as any).__BOOT_PHASE__ = "ENTRY_IMPORT_START";
console.info("[boot] ENTRY_IMPORT_START");

import("./main");
