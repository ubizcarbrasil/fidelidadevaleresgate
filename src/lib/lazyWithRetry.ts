import { lazy, type ComponentType } from "react";

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

      // Prevent infinite reload loop: only retry once per session
      const key = "chunk_reload_ts";
      const lastReload = sessionStorage.getItem(key);
      const now = Date.now();

      if (lastReload && now - Number(lastReload) < 10_000) {
        // Already reloaded recently — don't loop
        throw err;
      }

      sessionStorage.setItem(key, String(now));
      window.location.reload();

      // Return a never-resolving promise so React doesn't try to render
      return new Promise<{ default: T }>(() => {});
    }),
  );
}
