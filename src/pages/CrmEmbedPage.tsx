import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";

const CRM_BASE_URL = "https://valeresgatacrm.lovable.app/";

export default function CrmEmbedPage() {
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const { currentBrandId, currentBranchId } = useBrandGuard();
  const { user } = useAuth();

  const iframeSrc = useMemo(() => {
    const url = new URL(CRM_BASE_URL);
    if (currentBrandId) url.searchParams.set("brandId", currentBrandId);
    if (currentBranchId) url.searchParams.set("branchId", currentBranchId);
    if (user?.email) url.searchParams.set("email", user.email);
    return url.toString();
  }, [currentBrandId, currentBranchId, user?.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setBlocked(true);
        setLoading(false);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div className="relative -m-3 sm:-m-6" style={{ height: "calc(100vh - 3.5rem)" }}>
      {blocked ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="text-lg font-bold">CRM não pode ser exibido aqui</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            O site bloqueia a exibição dentro de iframes. Abra diretamente no navegador.
          </p>
          <Button onClick={() => window.open(iframeSrc, "_blank", "noopener")} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Abrir CRM no navegador
          </Button>
        </div>
      ) : (
        <>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <iframe
            src={iframeSrc}
            title="CRM Estratégico"
            className="h-full w-full border-0"
            onLoad={() => { setLoading(false); setBlocked(false); }}
            onError={() => { setBlocked(true); setLoading(false); }}
            allow="clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
          />
        </>
      )}
    </div>
  );
}
