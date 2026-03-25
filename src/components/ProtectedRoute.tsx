import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBootReady } from "@/lib/bootState";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const bootReady = useBootReady();

  if (!bootReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}
