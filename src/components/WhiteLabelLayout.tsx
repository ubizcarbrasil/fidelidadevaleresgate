import { useBrand } from "@/contexts/BrandContext";
import BranchSelector from "@/components/BranchSelector";
import PublicVouchers from "@/pages/PublicVouchers";
import { Loader2 } from "lucide-react";

export default function WhiteLabelLayout() {
  const { brand, loading, selectedBranch, branches } = useBrand();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Marca não encontrada para este domínio.</p>
      </div>
    );
  }

  // Show branch selector if multiple branches and none selected
  if (branches.length > 1 && !selectedBranch) {
    return <BranchSelector />;
  }

  return <PublicVouchers />;
}
