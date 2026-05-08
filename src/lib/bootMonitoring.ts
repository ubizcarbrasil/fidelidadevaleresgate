/**
 * Decide e dispara o carregamento de Sentry + web-vitals.
 * Em rotas /webview o modo "lite" pula tudo para acelerar in-app browsers.
 * Extraído de main.tsx para permitir testes automatizados.
 */

export function isWebviewLitePath(pathname: string): boolean {
  return pathname === "/webview" || pathname.startsWith("/webview/");
}

export interface MonitoringLoaders {
  loadSentry: () => Promise<{ initSentry: () => void }>;
  loadWebVitals: () => Promise<{ reportWebVitals: () => void }>;
}

const defaultLoaders: MonitoringLoaders = {
  loadSentry: () => import("@/lib/sentry"),
  loadWebVitals: () => import("@/lib/webVitals"),
};

/**
 * Retorna true se o monitoring foi agendado, false se foi pulado (webview-lite).
 */
export function startMonitoring(
  pathname: string,
  loaders: MonitoringLoaders = defaultLoaders,
): boolean {
  if (isWebviewLitePath(pathname)) {
    return false;
  }
  loaders.loadSentry().then(({ initSentry }) => initSentry()).catch(() => {});
  loaders.loadWebVitals().then(({ reportWebVitals }) => reportWebVitals()).catch(() => {});
  return true;
}