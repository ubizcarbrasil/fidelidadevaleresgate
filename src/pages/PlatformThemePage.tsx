import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import BrandThemeEditor from "@/components/BrandThemeEditor";
import type { BrandTheme } from "@/hooks/useBrandTheme";

const DEFAULT_THEME: BrandTheme = {
  colors: {
    primary: "262 83% 58%",
    secondary: "220 14% 96%",
    accent: "262 83% 58%",
    background: "0 0% 100%",
    foreground: "224 71% 4%",
    muted: "220 14% 96%",
    card: "0 0% 100%",
  },
};

export default function PlatformThemePage() {
  const [theme, setTheme] = useState<BrandTheme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_config")
        .select("*")
        .eq("key", "platform_theme")
        .maybeSingle();

      if (data?.value_json && typeof data.value_json === "object" && !Array.isArray(data.value_json)) {
        setTheme(data.value_json as unknown as BrandTheme);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("platform_config")
        .select("id")
        .eq("key", "platform_theme")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("platform_config")
          .update({ value_json: theme as any, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("platform_config")
          .insert({ key: "platform_theme", value_json: theme as any });
        if (error) throw error;
      }

      toast({ title: "Tema salvo com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tema da Plataforma"
          description="Configure as cores, fontes, logo e textos do sistema matriz."
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>
      <BrandThemeEditor
        value={theme}
        onChange={setTheme}
        brandName="Plataforma"
      />
    </div>
  );
}
