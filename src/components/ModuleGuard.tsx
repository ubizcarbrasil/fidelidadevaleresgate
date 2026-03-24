import { Navigate } from "react-router-dom";
import { useBrandModules } from "@/hooks/useBrandModules";

interface ModuleGuardProps {
  moduleKey: string;
  children: React.ReactNode;
}

/**
 * Redirects to Dashboard if the required module is not enabled for the current brand.
 * ROOT scope always passes through.
 */
export default function ModuleGuard({ moduleKey, children }: ModuleGuardProps) {
  const { isModuleEnabled, isLoading } = useBrandModules();

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isModuleEnabled(moduleKey)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
