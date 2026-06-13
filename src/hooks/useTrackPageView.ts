/**
 * useTrackPageView — dispara `$pageview` no PostHog quando o pathname muda.
 *
 * React Router não recarrega a página em SPA navigation. Sem este hook,
 * só o page_view inicial seria capturado e todo o resto da sessão ficaria
 * sem trail.
 *
 * Usar UMA vez no nível raiz do app (após BrowserRouter, antes das routes).
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

export function useTrackPageView(): void {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
}
