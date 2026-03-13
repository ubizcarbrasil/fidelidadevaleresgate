import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, ExternalLink, Loader2, BarChart3, Users, Target } from "lucide-react";
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
        <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center bg-muted/30">
          <div className="rounded-2xl bg-background border border-border shadow-lg p-8 max-w-md w-full flex flex-col items-center gap-5">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">CRM não pode ser exibido aqui</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                O site bloqueia a exibição dentro de iframes. Abra diretamente no navegador para acessar o CRM.
              </p>
            </div>
            <Button onClick={() => window.open(iframeSrc, "_blank", "noopener")} className="gap-2 w-full">
              <ExternalLink className="h-4 w-4" />
              Abrir CRM no navegador
            </Button>
          </div>
        </div>
      ) : (
        <>
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background gap-8">
              {/* Branded loading screen */}
              <div className="flex flex-col items-center gap-6 max-w-sm text-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Loader2 className="h-3 w-3 animate-spin text-primary-foreground" />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-foreground">CRM Estratégico</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preparando sua central de inteligência…
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-3 gap-3 w-full mt-2">
                  {[
                    { icon: Users, label: "Contatos" },
                    { icon: Target, label: "Campanhas" },
                    { icon: BarChart3, label: "Analytics" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 border border-border/50"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                </div>
              </div>
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
