import React from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/errorTracker";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
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
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-foreground">Algo deu errado</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              {this.state.error?.message || "Erro inesperado"}
            </p>
            <Button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}>
              Voltar ao início
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
