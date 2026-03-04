import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandProviderOverride } from "@/contexts/BrandContext";
import WhiteLabelLayout from "@/components/WhiteLabelLayout";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Brand = Tables<"brands">;
type Branch = Tables<"branches">;

export default function CustomerPreviewPage() {
  const { user, roles, isRootAdmin, loading: authLoading } = useAuth();
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
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const resolveBrandId = async (): Promise<string | null> => {
      const brandCandidates = new Set<string>();

      // 1) Collect candidates from roles.brand_id
      roles.forEach((r) => {
        if (r.brand_id) brandCandidates.add(r.brand_id);
      });

      // 2) Collect candidates from roles.branch_id -> branches.brand_id
      const roleBranchIds = Array.from(new Set(roles.map((r) => r.branch_id).filter(Boolean) as string[]));
      if (roleBranchIds.length > 0) {
        const { data: roleBranches } = await supabase
          .from("branches")
          .select("brand_id")
          .in("id", roleBranchIds);

        roleBranches?.forEach((b) => {
          if (b.brand_id) brandCandidates.add(b.brand_id);
        });
      }

      // 3) Profile brand as deterministic fallback/disambiguation
      const { data: profile } = await supabase
        .from("profiles")
        .select("brand_id")
        .eq("id", user.id)
        .single();
      const profileBrandId = profile?.brand_id ?? null;

      // 4) URL override only when user is root or when it belongs to user's accessible brands
      if (forcedBrandId && (isRootAdmin || brandCandidates.has(forcedBrandId) || brandCandidates.size === 0)) {
        return forcedBrandId;
      }

      if (brandCandidates.size === 1) {
        return Array.from(brandCandidates)[0];
      }

      if (profileBrandId && (brandCandidates.size === 0 || brandCandidates.has(profileBrandId))) {
        return profileBrandId;
      }

      if (brandCandidates.size > 0) {
        return Array.from(brandCandidates)[0];
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
  }, [user, roles, isRootAdmin, authLoading, forcedBrandId]);

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
