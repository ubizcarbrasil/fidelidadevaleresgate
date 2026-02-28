import { useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/contexts/AuthContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import BranchSelector from "@/components/BranchSelector";
import CustomerLayout from "@/components/customer/CustomerLayout";
import CustomerAuthPage from "@/pages/customer/CustomerAuthPage";
import PublicVouchers from "@/pages/PublicVouchers";
import { Loader2 } from "lucide-react";

export default function WhiteLabelLayout() {
  const { brand, loading, selectedBranch, branches } = useBrand();
  const { user, loading: authLoading } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  if (loading || authLoading) {
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

  // Guest mode: show public vouchers
  if (guestMode && !user) {
    return <PublicVouchers />;
  }

  // Not authenticated: show auth page
  if (!user) {
    return <CustomerAuthPage onSkip={() => setGuestMode(true)} />;
  }

  // Authenticated: show customer app
  return (
    <CustomerProvider>
      <CustomerLayout />
    </CustomerProvider>
  );
}
