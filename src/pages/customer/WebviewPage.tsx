import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * WebviewPage — versão ultraleve.
 * Evita lucide-react, shadcn Button e qualquer dependência pesada
 * para reduzir chunks e acelerar o primeiro render dentro de in-app browsers.
 */

const iconCls = "inline-block align-middle";
const IconBack = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconCls}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const IconExternal = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconCls}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
);
const IconShare = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconCls}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/></svg>
);
const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
const IconSpinner = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin opacity-60"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

const iconBtn =
  "inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted text-foreground shrink-0";
const primaryBtn =
  "inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90";

export default function WebviewPage() {
  const [params] = useSearchParams();
  const url = params.get("url") || "";
  const title = params.get("title") || "";
  const showHeader = params.get("header") !== "0";
  const showShare = params.get("share") === "1";
  const showBack = params.get("back") !== "0";

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Timeout to detect if iframe is blocked
    const timer = setTimeout(() => {
      if (loading) {
        setBlocked(true);
        setLoading(false);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // bfcache fix: in-app browsers restoram a página congelada ao voltar.
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  const handleOpenExternal = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || "Link", url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">URL não informada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && (
        <header className="sticky top-0 z-50 flex items-center gap-2 px-3 py-2 bg-card border-b shadow-sm">
          {showBack && (
            <button type="button" aria-label="Voltar" onClick={handleBack} className={iconBtn}>
              <IconBack />
            </button>
          )}
          <span className="flex-1 truncate text-sm font-semibold">{title || new URL(url).hostname}</span>
          <div className="flex items-center gap-1">
            {showShare && (
              <button type="button" aria-label="Compartilhar" onClick={handleShare} className={iconBtn}>
                <IconShare />
              </button>
            )}
            <button type="button" aria-label="Abrir externamente" onClick={handleOpenExternal} className={iconBtn}>
              <IconExternal />
            </button>
          </div>
        </header>
      )}

      {blocked ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <IconAlert />
          <h2 className="text-lg font-bold">Página não pode ser exibida aqui</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Este site bloqueia a exibição dentro de aplicativos. Você pode abri-lo diretamente no navegador.
          </p>
          <button type="button" onClick={handleOpenExternal} className={primaryBtn}>
            <IconExternal />
            Abrir no navegador
          </button>
        </div>
      ) : (
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <IconSpinner />
            </div>
          )}
          <iframe
            src={url}
            title={title || "Webview"}
            className="w-full h-full border-0"
            style={{ minHeight: "calc(100vh - 52px)" }}
            onLoad={() => { setLoading(false); setBlocked(false); }}
            onError={() => { setBlocked(true); setLoading(false); }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      )}
    </div>
  );
}
