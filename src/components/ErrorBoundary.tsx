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

/** Detecta rotas públicas (institucional, comercial e landing) que merecem
 *  fallback amigável em PT-BR — nunca expor mensagem técnica do React. */
function isRotaPublica(): boolean {
  if (typeof window === "undefined") return true;
  const path = window.location.pathname;
  if (path === "/" || path === "/index") return true;
  return (
    path.startsWith("/trial") ||
    path.startsWith("/p/") ||
    path.startsWith("/landing") ||
    path.startsWith("/register-store") ||
    path.startsWith("/driver") ||
    path.startsWith("/d/") ||
    path.startsWith("/ofertas") ||
    path.startsWith("/loja/")
  );
}

/** Em produção nunca exibimos a mensagem crua do React (vem minificada e assusta). */
const IS_PROD = import.meta.env.MODE === "production";

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
      // Auto-recovery: dispara o fluxo de limpeza + reload sem o usuário
      // precisar clicar. O overlay do pwaRecovery (visualmente alinhado ao
      // TelaCarregamento) cobre essa tela em < 100ms, então o usuário não
      // chega a ver mensagem alarmista. Botão fica como fallback de 2ª
      // tentativa caso o recovery automático não dispare.
      void recoverFromChunkError();
      return (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[9999] flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center"
        >
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg
              width={96}
              height={96}
              viewBox="0 0 96 96"
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="eb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <circle cx={48} cy={48} r={45} fill="none" stroke="hsl(var(--primary) / 0.08)" strokeWidth={3} />
              <circle
                cx={48}
                cy={48}
                r={45}
                fill="none"
                stroke="url(#eb-grad)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="99 283"
              />
            </svg>
            <img
              src="/logo-vale-resgate.png"
              alt=""
              aria-hidden="true"
              className="absolute h-12 w-12 rounded-full object-contain animate-loader-pulse-soft motion-reduce:animate-none"
            />
          </div>
          <p className="max-w-xs text-sm font-medium text-muted-foreground">
            Sincronizando…
          </p>
        </div>
      );
    }

    const reset = () =>
      this.setState({ hasError: false, error: null, isChunkError: false });

    // Rotas públicas: fallback amigável em PT-BR, sem texto técnico.
    if (isRotaPublica()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-xl font-bold text-foreground">
              Não conseguimos carregar essa página
            </h2>
            <p className="text-muted-foreground text-sm">
              Tivemos um problema temporário ao abrir esta página. Você pode voltar
              ao início ou tentar novamente em instantes.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                onClick={() => {
                  reset();
                  window.location.href = "/";
                }}
              >
                Voltar ao início
              </Button>
              <Button variant="outline" onClick={reset}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Rotas internas (logado): pode mostrar mensagem em dev, nunca em prod.
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl font-bold text-foreground">Algo deu errado</h2>
          <p className="text-muted-foreground text-sm">
            {IS_PROD
              ? "Tivemos um problema inesperado. Volte ao início e tente novamente."
              : this.state.error?.message || "Erro inesperado"}
          </p>
          <Button
            onClick={() => {
              reset();
              window.location.href = "/";
            }}
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }
}
