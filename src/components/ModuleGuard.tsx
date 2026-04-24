import { Navigate } from "react-router-dom";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useResolvedModules } from "@/compartilhados/hooks/hook_modulos_resolvidos";
import { useBootReady } from "@/lib/bootState";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";

interface ModuleGuardProps {
  moduleKey: string;
  children: React.ReactNode;
}

/**
 * Redirects to Dashboard if the required module is not enabled for the current brand.
 * Waits for boot to resolve before making any redirect decision.
 */
export default function ModuleGuard({ moduleKey, children }: ModuleGuardProps) {
  const { isRootAdmin, currentBrandId, currentBranchId } = useBrandGuard();
  const { isModuleEnabled, isLoading, modules } = useResolvedModules(currentBrandId, currentBranchId);
  const bootReady = useBootReady();

  // Root admin tem acesso total, não precisa esperar resolver módulos.
  if (isRootAdmin) return <>{children}</>;

  // Antes do boot resolver, mostramos o conteúdo otimisticamente — é mais
  // rápido renderizar a página e deixar a query interna mostrar seu skeleton
  // do que travar tudo num loader genérico.
  // Só bloqueamos enquanto a primeira resolução de módulos está em curso
  // E ainda não temos nada em cache.
  const hasCache = Object.keys(modules).length > 0;
  if (!bootReady && !hasCache) {
    return <TelaCarregamentoInline />;
  }
  if (isLoading && !hasCache) {
    return <TelaCarregamentoInline />;
  }

  // Suporte a múltiplos módulos com "|" (OR): qualquer um habilitado libera
  const keys = moduleKey.split("|").map(k => k.trim());
  const anyEnabled = keys.some(k => isModuleEnabled(k));

  if (!anyEnabled) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
