import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Check, X, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type StatusEtapa = "pendente" | "ativo" | "ok" | "falha";

interface EtapaProgresso {
  id: "sw" | "cache" | "reload";
  label: string;
  status: StatusEtapa;
  detalhe?: string;
}

const ETAPAS_INICIAIS: EtapaProgresso[] = [
  { id: "sw", label: "Limpando Service Worker", status: "pendente" },
  { id: "cache", label: "Limpando cache do navegador", status: "pendente" },
  { id: "reload", label: "Recarregando aplicativo", status: "pendente" },
];

interface Props {
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  label?: string;
  /** Caminho a recarregar após limpar caches. Default: rota atual. */
  reloadTo?: string;
}

/**
 * Botão "Atualizar agora": desregistra Service Workers, limpa caches do
 * navegador (CacheStorage) e força reload — útil para garantir que o
 * cliente pegue a versão mais recente do bundle / cacheId.
 */
export default function BotaoAtualizarApp({
  variant = "outline",
  size = "sm",
  className,
  label = "Atualizar agora",
  reloadTo,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressoOpen, setProgressoOpen] = useState(false);
  const [etapas, setEtapas] = useState<EtapaProgresso[]>(ETAPAS_INICIAIS);
  const [etapaAtual, setEtapaAtual] = useState<EtapaProgresso["id"] | null>(null);

  const atualizarEtapa = (id: EtapaProgresso["id"], patch: Partial<EtapaProgresso>) => {
    setEtapas((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const iniciarEtapa = (id: EtapaProgresso["id"]) => {
    setEtapaAtual(id);
    atualizarEtapa(id, { status: "ativo", detalhe: undefined });
  };

  /**
   * Executa uma promise com timeout — se demorar mais que `ms`, rejeita
   * para evitar que o botão fique preso esperando rede instável.
   */
  const comTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout em ${label}`)), ms);
      p.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        },
      );
    });
  };

  const executarLimpeza = async () => {
    setConfirmOpen(false);
    setEtapas(ETAPAS_INICIAIS.map((e) => ({ ...e })));
    setProgressoOpen(true);
    setLoading(true);

    const target = reloadTo ?? window.location.pathname + window.location.search;
    const erros: string[] = [];

    // 1. Desregistra Service Workers — tolerante a falha individual.
    iniciarEtapa("sw");
    if ("serviceWorker" in navigator) {
      try {
        const regs = await comTimeout(
          navigator.serviceWorker.getRegistrations(),
          4000,
          "Service Worker",
        );
        await Promise.all(
          regs.map((r) =>
            r.unregister().catch((e) => {
              erros.push(`SW: ${e?.message ?? e}`);
              return false;
            }),
          ),
        );
        atualizarEtapa("sw", {
          status: "ok",
          detalhe: regs.length === 0 ? "Nenhum SW ativo" : `${regs.length} desregistrado(s)`,
        });
      } catch (e: any) {
        erros.push(`SW: ${e?.message ?? e}`);
        atualizarEtapa("sw", { status: "falha", detalhe: e?.message ?? "Falhou" });
      }
    } else {
      atualizarEtapa("sw", { status: "ok", detalhe: "Não suportado" });
    }

    // 2. Apaga CacheStorage — também tolerante.
    iniciarEtapa("cache");
    if ("caches" in window) {
      try {
        const keys = await comTimeout(caches.keys(), 4000, "CacheStorage");
        await Promise.all(
          keys.map((k) =>
            caches.delete(k).catch((e) => {
              erros.push(`Cache ${k}: ${e?.message ?? e}`);
              return false;
            }),
          ),
        );
        atualizarEtapa("cache", {
          status: "ok",
          detalhe: keys.length === 0 ? "Nenhum cache" : `${keys.length} cache(s) apagado(s)`,
        });
      } catch (e: any) {
        erros.push(`CacheStorage: ${e?.message ?? e}`);
        atualizarEtapa("cache", { status: "falha", detalhe: e?.message ?? "Falhou" });
      }
    } else {
      atualizarEtapa("cache", { status: "ok", detalhe: "Não suportado" });
    }

    // 3. Mensagem clara se algo falhou — mas SEMPRE tenta recarregar.
    if (erros.length > 0) {
      toast.warning(
        "Conexão instável: nem tudo foi limpo. Tentando recarregar mesmo assim...",
        { duration: 3500 },
      );
      console.warn("[BotaoAtualizarApp] falhas durante limpeza:", erros);
    } else {
      toast.success("Caches limpos. Recarregando...");
    }

    iniciarEtapa("reload");
    // 4. Reload com fallback: tenta replace; se não voltar em 5s, faz reload duro;
    //    se nem isso responder em mais 4s, exibe mensagem para o usuário recarregar manualmente.
    const tentarReload = () => {
      try {
        window.location.replace(target);
      } catch {
        try {
          window.location.href = target;
        } catch {
          /* ignore */
        }
      }
    };

    setTimeout(tentarReload, 500);

    setTimeout(() => {
      try {
        window.location.reload();
      } catch {
        /* ignore */
      }
    }, 5500);

    setTimeout(() => {
      // Se ainda estamos aqui, o navegador não conseguiu sair da página.
      setLoading(false);
      atualizarEtapa("reload", { status: "falha", detalhe: "Recarga não completou" });
      setEtapaAtual(null);
      toast.error(
        "Não foi possível recarregar automaticamente. Verifique sua conexão e puxe a tela para baixo (ou feche e abra o app) para atualizar.",
        { duration: 8000 },
      );
    }, 9500);
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        <span className="ml-1.5">
          {loading
            ? etapaAtual === "sw"
              ? "Limpando SW..."
              : etapaAtual === "cache"
              ? "Limpando cache..."
              : etapaAtual === "reload"
              ? "Recarregando..."
              : "Atualizando..."
            : label}
        </span>
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar o aplicativo agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação vai desregistrar o Service Worker, apagar os caches
              salvos no navegador e recarregar a página para baixar a versão
              mais recente. Você não perde dados da sua conta — apenas o
              cache local é limpo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executarLimpeza}>
              Sim, atualizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogProgressoAtualizacao
        open={progressoOpen}
        onOpenChange={(o) => {
          // Só permite fechar quando não está mais carregando (ex: caso de falha final).
          if (!loading) setProgressoOpen(o);
        }}
        etapas={etapas}
      />
    </>
  );
}

function DialogProgressoAtualizacao({
  open,
  onOpenChange,
  etapas,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  etapas: EtapaProgresso[];
}) {
  const concluidas = etapas.filter((e) => e.status === "ok" || e.status === "falha").length;
  const total = etapas.length;
  const pct = Math.round((concluidas / total) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Atualizando aplicativo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Progress value={pct} className="h-2" />
          <ul className="space-y-3">
            {etapas.map((etapa) => (
              <li key={etapa.id} className="flex items-start gap-3">
                <IconeStatus status={etapa.status} />
                <div className="flex-1 min-w-0">
                  <p
                    className={
                      etapa.status === "falha"
                        ? "text-sm font-medium text-destructive"
                        : etapa.status === "ativo"
                        ? "text-sm font-medium text-foreground"
                        : "text-sm font-medium text-muted-foreground"
                    }
                  >
                    {etapa.label}
                  </p>
                  {etapa.detalhe && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {etapa.detalhe}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Mantenha esta tela aberta. Se sua internet estiver instável, pode
            levar alguns segundos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IconeStatus({ status }: { status: StatusEtapa }) {
  if (status === "ok") {
    return (
      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (status === "falha") {
    return (
      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <X className="h-3 w-3" />
      </span>
    );
  }
  if (status === "ativo") {
    return (
      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <CircleDashed className="h-3 w-3" />
    </span>
  );
}