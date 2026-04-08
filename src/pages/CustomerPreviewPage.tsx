import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandProviderOverride } from "@/contexts/BrandContext";
import WhiteLabelLayout from "@/components/WhiteLabelLayout";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import CustomerAuthPage from "@/pages/customer/CustomerAuthPage";
import { ContextBadge } from "@/components/ContextBadge";

type Brand = Tables<"brands">;
type Branch = Tables<"branches">;

/**
 * Standalone brand-themed auth page shown when user is not logged in
 * but we can resolve the brand from the URL param.
 */
function BrandThemedAuth({ brandId }: { brandId: string }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        setBrand(data);
        setLoading(false);
      });
  }, [brandId]);

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
        <p className="text-muted-foreground">Marca não encontrada.</p>
      </div>
    );
  }

  return (
    <BrandProviderOverride brand={brand} branches={[]}>
      <CustomerAuthPage />
    </BrandProviderOverride>
  );
}

export default function CustomerPreviewPage() {
  const { user, roles, loading: authLoading } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const forcedBrandId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("brandId");
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Not authenticated — we'll show the brand-themed auth page
      setLoading(false);
      return;
    }

    const resolveBrandId = async (): Promise<string | null> => {
      if (forcedBrandId) return forcedBrandId;

      const { data: profile } = await supabase
        .from("profiles")
        .select("brand_id")
        .eq("id", user.id)
        .single();
      if (profile?.brand_id) return profile.brand_id;

      const roleWithBrand = roles.find((r) => r.brand_id);
      if (roleWithBrand?.brand_id) return roleWithBrand.brand_id;

      const roleWithBranch = roles.find((r) => r.branch_id);
      if (roleWithBranch?.branch_id) {
        const { data: branchRow } = await supabase
          .from("branches")
          .select("brand_id")
          .eq("id", roleWithBranch.branch_id)
          .single();
        if (branchRow?.brand_id) return branchRow.brand_id;
      }

      return null;
    };

    const fetchData = async () => {
      const brandId = await resolveBrandId();

      if (!brandId) {
        setError("Não foi possível identificar a marca do usuário logado.");
        setLoading(false);
        return;
      }

      // Fetch brand and branches in parallel
      const [brandResult, branchResult] = await Promise.all([
        supabase
          .from("brands")
          .select("*")
          .eq("id", brandId)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("branches")
          .select("*")
          .eq("brand_id", brandId)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (brandResult.error || !brandResult.data) {
        setError("Marca não encontrada ou inativa.");
        setLoading(false);
        return;
      }

      setBrand(brandResult.data);
      setBranches(branchResult.data || []);
      setLoading(false);
    };
    fetchData();
  }, [user, roles, authLoading, forcedBrandId]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated: show brand-themed login if we have a brandId from URL
  if (!user) {
    if (forcedBrandId) {
      return <BrandThemedAuth brandId={forcedBrandId} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Usuário não autenticado.</p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{error || "Erro ao carregar preview."}</p>
      </div>
    );
  }

  const isImpersonating = !!forcedBrandId;

  return (
    <BrandProviderOverride brand={brand} branches={branches}>
      <div className="relative">
        <WhiteLabelLayout />
      </div>
    </BrandProviderOverride>
  );
}
