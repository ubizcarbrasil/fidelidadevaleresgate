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

  if (loading) {
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
