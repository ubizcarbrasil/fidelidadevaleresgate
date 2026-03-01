import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Share2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <span className="flex-1 truncate text-sm font-semibold">{title || new URL(url).hostname}</span>
          <div className="flex items-center gap-1">
            {showShare && (
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleOpenExternal}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </header>
      )}

      {blocked ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="text-lg font-bold">Página não pode ser exibida aqui</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Este site bloqueia a exibição dentro de aplicativos. Você pode abri-lo diretamente no navegador.
          </p>
          <Button onClick={handleOpenExternal} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir no navegador
          </Button>
        </div>
      ) : (
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
