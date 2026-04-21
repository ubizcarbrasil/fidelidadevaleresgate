import { lazy, type ComponentType } from "react";
import { recoverFromChunkError, canAttemptRecovery } from "@/lib/pwaRecovery";

/**
 * Wrapper around React.lazy that retries a failed dynamic import once.
 * When a deploy/rebuild invalidates old chunks, the first import fails with
 * "Importing a module script failed" or "Failed to fetch dynamically imported module".
 * This helper catches that and does ONE hard reload (with a sessionStorage flag
 * to prevent infinite loops).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isChunkError =
        errMsg.includes("Failed to fetch dynamically imported module") ||
        errMsg.includes("Importing a module script failed") ||
        errMsg.includes("error loading dynamically imported module") ||
        errMsg.includes("Loading chunk") ||
        errMsg.includes("Loading CSS chunk");

      if (!isChunkError) throw err;

      // Cooldown único compartilhado com installGlobalDomErrorRecovery.
      // Se outro caminho já disparou recovery recentemente, não relançamos.
      if (!canAttemptRecovery()) throw err;
      void recoverFromChunkError();

      // Return a never-resolving promise so React doesn't try to render
      return new Promise<{ default: T }>(() => {});
    }),
  );
}
