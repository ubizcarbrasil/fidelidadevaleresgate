import { Navigate } from "react-router-dom";
import { useBrandModules } from "@/hooks/useBrandModules";
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
  const { isModuleEnabled, isLoading } = useBrandModules();
  const bootReady = useBootReady();

  if (!bootReady || isLoading) {
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
