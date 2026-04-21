import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBootReady } from "@/lib/bootState";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";

interface RootGuardProps {
  children: React.ReactNode;
}

/**
 * Redirects to Dashboard if the current user is not a root_admin.
 * Waits for boot to resolve before making any redirect decision.
 */
export default function RootGuard({ children }: RootGuardProps) {
  const { isRootAdmin, loading } = useAuth();
  const bootReady = useBootReady();

  if (!bootReady || loading) {
    return <TelaCarregamentoInline />;
  }

  if (!isRootAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
