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

  const executarLimpeza = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      // 1. Desregistra todos os Service Workers ativos.
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      // 2. Apaga todos os caches (CacheStorage).
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      toast.success("Caches limpos. Recarregando...");
      // 3. Pequeno delay para o toast aparecer e força reload sem cache.
      setTimeout(() => {
        const target = reloadTo ?? window.location.pathname + window.location.search;
        window.location.replace(target);
      }, 400);
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível limpar o cache.");
      setLoading(false);
    }
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