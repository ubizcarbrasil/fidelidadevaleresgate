import { useEffect } from "react";

/**
 * Invisible component that signals the bootstrap overlay
 * that React has successfully mounted and committed to the DOM.
 * Must be rendered inside the React tree (e.g. inside App).
 */
export default function MountSignal() {
  useEffect(() => {
    (window as any).__APP_MOUNTED__ = true;
    if (typeof (window as any).__dismissBootstrap === "function") {
      (window as any).__dismissBootstrap();
    }
  }, []);

  return null;
}
