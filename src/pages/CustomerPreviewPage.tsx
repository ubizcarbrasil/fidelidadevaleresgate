import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandProviderOverride } from "@/contexts/BrandContext";
import WhiteLabelLayout from "@/components/WhiteLabelLayout";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Brand = Tables<"brands">;
type Branch = Tables<"branches">;

export default function CustomerPreviewPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      // Find a brand that has at least one active branch
      const { data: branchWithBrand } = await supabase
        .from("branches")
        .select("brand_id")
        .eq("is_active", true)
        .limit(1)
        .single();

      const targetBrandId = branchWithBrand?.brand_id;

      const { data: brandData, error: brandErr } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .eq("id", targetBrandId || "00000000-0000-0000-0000-000000000000")
        .limit(1)
        .single();

      if (brandErr || !brandData) {
        setError("Nenhuma brand ativa encontrada no banco.");
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
    fetch();
  }, []);

  if (loading) {
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
