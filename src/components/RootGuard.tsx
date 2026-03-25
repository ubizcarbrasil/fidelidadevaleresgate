import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBootReady } from "@/lib/bootState";

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
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isRootAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
