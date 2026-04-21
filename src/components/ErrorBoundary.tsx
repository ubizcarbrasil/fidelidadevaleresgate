import React from "react";
import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/errorTracker";
import { setBootPhase, dismissBootstrap } from "@/lib/bootState";
import { recoverFromChunkError, isRecoverableDomError } from "@/lib/pwaRecovery";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  return isRecoverableDomError(error.message);
}

/** Detecta rotas comerciais públicas que merecem fallback amigável (sem texto técnico). */
function isRotaComercialPublica(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return (
    path.startsWith("/trial") ||
    path.startsWith("/p/") ||
    path.startsWith("/landing") ||
    path.startsWith("/register-store")
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    setBootPhase("FAILED", error.message);
    dismissBootstrap();

    // Reportar ao Sentry
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack?.slice(0, 2000) } },
    });

    reportError({
      message: error.message,
      stack: error.stack,
      source: "boundary",
      severity: "fatal",
      metadata: {
        componentStack: errorInfo.componentStack?.slice(0, 2000),
      },
    });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.state.isChunkError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground">Atualização disponível</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              Uma nova versão do app foi publicada. Recarregue a página para continuar.
            </p>
            <Button onClick={() => void recoverFromChunkError()}>
              Recarregar página
            </Button>
          </div>
        </div>
      );
    }

    // Rotas comerciais públicas: nunca mostrar texto técnico do React minificado.
    if (isRotaComercialPublica()) {
      const reset = () => this.setState({ hasError: false, error: null, isChunkError: false });
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-xl font-bold text-foreground">Não conseguimos carregar essa página</h2>
            <p className="text-muted-foreground text-sm">
              Tivemos um problema temporário. Você pode tentar novamente ou começar seu teste grátis agora.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                onClick={() => {
                  reset();
                  window.location.href = "/trial";
                }}
              >
                Começar trial grátis
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  window.location.reload();
                }}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Algo deu errado</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            {this.state.error?.message || "Erro inesperado"}
          </p>
          <Button onClick={() => { this.setState({ hasError: false, error: null, isChunkError: false }); window.location.href = "/"; }}>
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }
}
