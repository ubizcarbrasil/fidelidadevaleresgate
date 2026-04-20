import { Smartphone, Share, Plus, MoreVertical, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function InstallPwaPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background pwa-safe-top pwa-safe-bottom pwa-safe-x">
      <div className="max-w-md mx-auto p-4 sm:p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Instalar o aplicativo</h1>
          <p className="text-sm text-muted-foreground">
            Use direto da tela inicial do seu celular, em tela cheia, sem barra do navegador.
          </p>
        </div>

        {isStandalone && (
          <Card className="border-success/30 bg-success/10">
            <CardContent className="pt-4 text-sm text-foreground">
              ✅ Você já está usando o aplicativo instalado.
            </CardContent>
          </Card>
        )}

        {deferredPrompt && !isStandalone && (
          <Button onClick={handleInstall} className="w-full gap-2" size="lg">
            <Download className="h-5 w-5" /> Instalar agora
          </Button>
        )}

        {!isStandalone && (
          <>
            {isIOS ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">No iPhone / iPad (Safari)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">1</div>
                    <p>Toque no ícone <Share className="inline h-4 w-4 align-text-bottom" /> <strong>Compartilhar</strong> na barra inferior do Safari.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">2</div>
                    <p>Role e toque em <Plus className="inline h-4 w-4 align-text-bottom" /> <strong>Adicionar à Tela de Início</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">3</div>
                    <p>Confirme em <strong>Adicionar</strong>. Pronto, o app aparece na sua tela inicial.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">No Android (Chrome / Edge)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">1</div>
                    <p>Toque no menu <MoreVertical className="inline h-4 w-4 align-text-bottom" /> no canto superior direito do navegador.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">2</div>
                    <p>Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">3</div>
                    <p>Confirme. O ícone do app aparecerá na tela inicial do celular.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Funciona em qualquer celular moderno. Sem app store, sem cadastro extra.
        </p>
      </div>
    </div>
  );
}