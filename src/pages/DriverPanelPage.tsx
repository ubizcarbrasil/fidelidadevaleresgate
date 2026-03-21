import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import DriverMarketplace from "@/components/driver/DriverMarketplace";

export default function DriverPanelPage() {
  const [searchParams] = useSearchParams();
  const brandId = searchParams.get("brandId");
  const branchId = searchParams.get("branchId") || null;
  const initialCategoryId = searchParams.get("categoryId") || null;
  const initialDealId = searchParams.get("dealId") || null;

  const [brand, setBrand] = useState<any>(null);
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Force dark mode like customer app
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    if (!brandId) {
      setError("Parâmetro brandId é obrigatório");
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data: b } = await supabase
        .from("brands")
        .select("*")
        .eq("id", brandId)
        .single();

      if (!b) {
        setError("Marca não encontrada");
        setLoading(false);
        return;
      }
      setBrand(b);

      if (branchId) {
        const { data: br } = await supabase
          .from("branches")
          .select("*")
          .eq("id", branchId)
          .single();
        setBranch(br);
      }

      setLoading(false);
    };
    load();
  }, [brandId, branchId]);

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
        <p className="text-muted-foreground">{error || "Erro ao carregar"}</p>
      </div>
    );
  }

  // Extract theme from brand_settings_json
  const settings = brand.brand_settings_json as any;
  const theme = settings?.theme || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DriverMarketplace brand={brand} branch={branch} theme={theme} />
    </div>
  );
}