/**
 * Funções puras de roteamento — usadas por App.tsx para decidir qual
 * árvore de rotas renderizar (admin, white-label, public, fast-track).
 *
 * Mantenha estes helpers PUROS e sincronos: a árvore deve poder ser decidida
 * antes de carregar AuthProvider/BrandProvider para o fast-track de /ofertas.
 */

export const PORTAL_HOSTNAME = "app.valeresgate.com.br";

/**
 * Rotas públicas que NÃO exigem resolução de marca/sessão. ProtectedRoute
 * e o AppLayout continuam fazendo seus próprios guards onde aplicável.
 */
export const PUBLIC_PATHS = [
  "/auth",
  "/reset-password",
  "/trial",
  "/landing",
  "/register-store",
  "/p/",
  "/driver",
  "/d/",
  "/loja/",
  "/campeonato/",
  "/ofertas",
  "/motorista/",
] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export function isOfertasPath(pathname: string): boolean {
  return pathname === "/ofertas" || pathname.startsWith("/ofertas/");
}

export function isWebviewPath(pathname: string): boolean {
  return pathname === "/webview" || pathname.startsWith("/webview/");
}

export function isDriverPath(pathname: string): boolean {
  return pathname === "/driver" || pathname.startsWith("/driver/");
}

export function isCampeonatoMotoristaPath(pathname: string): boolean {
  return pathname === "/motorista/campeonato";
}

/** Regex testada contra strings de path — landing de parceiro: `/<slug>/parceiro` */
export function isPartnerLandingPath(pathname: string): boolean {
  return /^\/[^/]+\/parceiro\/?$/.test(pathname);
}

export function isPortalDomain(): boolean {
  return typeof window !== "undefined" && window.location.hostname === PORTAL_HOSTNAME;
}

/**
 * `true` quando a rota corrente deve pular AuthProvider/BrandProvider
 * (uso em in-app browsers onde getSession() pode travar).
 */
export function shouldUseFastTrack(pathname: string): boolean {
  return (
    isOfertasPath(pathname) ||
    isWebviewPath(pathname) ||
    isDriverPath(pathname) ||
    isCampeonatoMotoristaPath(pathname)
  );
}
