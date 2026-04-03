import { Suspense, lazy } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/contexts/AuthContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import BranchSelector from "@/components/BranchSelector";
import { Loader2 } from "lucide-react";

// Lazy-load customer layout to avoid pulling heavy customer modules into admin boot
const CustomerLayout = lazy(() => import("@/components/customer/CustomerLayout"));

export default function WhiteLabelLayout() {
  const { brand, loading, selectedBranch, branches } = useBrand();
  const { loading: authLoading } = useAuth();

  const isLoading = loading || authLoading;
  const needsBranchSelection = !isLoading && brand && branches.length > 1 && !selectedBranch;
  const showContent = !isLoading && brand && !needsBranchSelection;

  return (
    <>
      {isLoading && (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !brand && (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-muted-foreground">Marca não encontrada para este domínio.</p>
        </div>
      )}

      {needsBranchSelection && <BranchSelector />}

      {showContent && (
        <CustomerProvider>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <CustomerLayout />
          </Suspense>
        </CustomerProvider>
      )}
    </>
  );
}
