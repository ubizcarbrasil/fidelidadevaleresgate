import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import DriverMarketplace from "@/components/driver/DriverMarketplace";

export default function DriverPanelPage() {
  const [searchParams] = useSearchParams();
  const brandId = searchParams.get("brandId");
  const branchId = searchParams.get("branchId") || null;

  const [brand, setBrand] = useState<any>(null);
  const [branch, setBranch] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Load theme
      if (b.default_theme_id) {
        const { data: t } = await supabase
          .from("brand_themes")
          .select("*")
          .eq("id", b.default_theme_id)
          .single();
        if (t) {
          try {
            setTheme(typeof t.theme_json === "string" ? JSON.parse(t.theme_json) : t.theme_json);
          } catch {
            setTheme(null);
          }
        }
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

  return (
    <div className="min-h-screen bg-background">
      <DriverMarketplace brand={brand} branch={branch} theme={theme} />
    </div>
  );
}
