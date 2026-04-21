import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
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
    setLoading(true);

    const target = reloadTo ?? window.location.pathname + window.location.search;
    const erros: string[] = [];

    // 1. Desregistra Service Workers — tolerante a falha individual.
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
      } catch (e: any) {
        erros.push(`SW: ${e?.message ?? e}`);
      }
    }

    // 2. Apaga CacheStorage — também tolerante.
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
      } catch (e: any) {
        erros.push(`CacheStorage: ${e?.message ?? e}`);
      }
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
        <span className="ml-1.5">{loading ? "Atualizando..." : label}</span>
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
    </>
  );
}