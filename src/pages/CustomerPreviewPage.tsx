import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandProviderOverride } from "@/contexts/BrandContext";
import WhiteLabelLayout from "@/components/WhiteLabelLayout";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Brand = Tables<"brands">;
type Branch = Tables<"branches">;

export default function CustomerPreviewPage() {
  const { user, roles, loading: authLoading } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const resolveBrandId = async (): Promise<string | null> => {
      // 1) Try from roles directly
      const roleWithBrand = roles.find((r) => r.brand_id);
      if (roleWithBrand?.brand_id) return roleWithBrand.brand_id;

      // 2) Try from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("brand_id")
        .eq("id", user.id)
        .single();
      if (profile?.brand_id) return profile.brand_id;

      // 3) Try from branch_id in roles → get brand_id from branch
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

      const { data: brandData, error: brandErr } = await supabase
        .from("brands")
        .select("*")
        .eq("id", brandId)
        .eq("is_active", true)
        .single();

      if (brandErr || !brandData) {
        setError("Marca não encontrada ou inativa.");
        setLoading(false);
        return;
      }

      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .eq("brand_id", brandData.id)
        .eq("is_active", true)
        .order("name");

      setBrand(brandData);
      setBranches(branchData || []);
      setLoading(false);
    };
    fetchData();
  }, [user, roles, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  return (
    <BrandProviderOverride brand={brand} branches={branches}>
      <WhiteLabelLayout />
    </BrandProviderOverride>
  );
}
