import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RootGuardProps {
  children: React.ReactNode;
}

/**
 * Redirects to Dashboard if the current user is not a root_admin.
 */
export default function RootGuard({ children }: RootGuardProps) {
  const { isRootAdmin, loading } = useAuth();

  if (loading) return null;

  if (!isRootAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
