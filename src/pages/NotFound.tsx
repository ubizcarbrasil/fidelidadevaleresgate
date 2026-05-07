import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: rota inexistente:", location.pathname);
  }, [location.pathname]);

  const recarregar = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {}
    window.location.replace(location.pathname + location.search);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <p className="text-base text-muted-foreground">
          Não encontramos a página{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-sm">
            {location.pathname}
          </code>
        </p>
        <p className="text-xs text-muted-foreground">
          Se a página foi criada recentemente, pode ser que o navegador esteja com a versão
          antiga em cache. Tente recarregar limpando o cache.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={recarregar} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar limpando cache
          </Button>
          <Button variant="outline" asChild className="w-full">
            <a href="/">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao início
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
