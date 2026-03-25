import React from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/errorTracker";
import { setBootPhase, dismissBootstrap } from "@/lib/bootState";

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
  const msg = error.message || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk")
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
            <Button onClick={() => window.location.reload()}>
              Recarregar página
            </Button>
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
