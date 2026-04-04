import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PWAUpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export default function PWAUpdateBanner({ onUpdate, onDismiss }: PWAUpdateBannerProps) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <RefreshCw className="h-5 w-5 shrink-0 text-primary" />
        <p className="flex-1 text-sm text-foreground">
          Nova versão disponível!
        </p>
        <Button size="sm" onClick={onUpdate}>
          Atualizar
        </Button>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
