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

  // While loading, render nothing to avoid flash
  if (isLoading) return null;

  if (!isModuleEnabled(moduleKey)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
