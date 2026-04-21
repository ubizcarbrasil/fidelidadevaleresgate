import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBootReady } from "@/lib/bootState";
import TelaCarregamento from "@/compartilhados/components/tela_carregamento";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const bootReady = useBootReady();

  if (!bootReady || loading) {
    return <TelaCarregamento />;
  }

  if (!session) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}
