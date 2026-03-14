import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BadgeConfigEditor from "@/components/BadgeConfigEditor";
import PageHeader from "@/components/PageHeader";
import { Save, RotateCcw, ShoppingBag, Store, Zap, Sparkles, Eye } from "lucide-react";
import type { OfferCardConfig, OfferTypeCardConfig } from "@/hooks/useOfferCardConfig";
import { DEFAULT_CONFIG } from "@/hooks/useOfferCardConfig";
import type { BadgeConfig } from "@/hooks/useBrandTheme";
import type { Json } from "@/integrations/supabase/types";

const TABS = [
  { key: "store" as const, label: "Loja Toda", icon: Store },
  { key: "product" as const, label: "Produto", icon: ShoppingBag },
  { key: "emitter" as const, label: "Emissor", icon: Zap },
];

const SAMPLE_DATA: Record<string, Record<string, number | string>> = {
  store: { credit: 15, points: 15, percent: 0, min: 30, points_per_real: 0, store_name: "Pizzaria do João" },
  product: { credit: 25, points: 25, percent: 30, min: 50, points_per_real: 0, store_name: "Loja do Centro" },
  emitter: { credit: 0, points: 0, percent: 0, min: 0, points_per_real: 2, store_name: "Auto Posto" },
};

function applyTemplate(template: string, data: Record<string, number | string>): string {
  return template
    .replace(/\{credit\}/g, Number(data.credit).toFixed(2).replace(".", ","))
    .replace(/\{points\}/g, String(Math.floor(Number(data.points))))
    .replace(/\{percent\}/g, String(data.percent))
    .replace(/\{min\}/g, Number(data.min).toFixed(2).replace(".", ","))
    .replace(/\{points_per_real\}/g, String(data.points_per_real))
    .replace(/\{store_name\}/g, String(data.store_name));
}

const VARIABLES_HELP: Record<string, string[]> = {
  store: ["{credit}", "{points}", "{min}", "{store_name}"],
  product: ["{credit}", "{points}", "{percent}", "{min}", "{store_name}"],
  emitter: ["{points_per_real}", "{store_name}"],
};

export default function OfferCardConfigPage() {
  const { currentBrandId } = useBrandGuard();
  const [config, setConfig] = useState<OfferCardConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentBrandId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", currentBrandId)
        .single();
      if (data?.brand_settings_json && typeof data.brand_settings_json === "object") {
        const settings = data.brand_settings_json as Record<string, unknown>;
        if (settings.offer_card_config) {
          const saved = settings.offer_card_config as Partial<OfferCardConfig>;
          setConfig({
            store: { ...DEFAULT_CONFIG.store, ...(saved.store || {}) },
            product: { ...DEFAULT_CONFIG.product, ...(saved.product || {}) },
            emitter: { ...DEFAULT_CONFIG.emitter, ...(saved.emitter || {}) },
          });
        }
      }
      setLoading(false);
    };
    fetch();
  }, [currentBrandId]);

  const handleSave = async () => {
    if (!currentBrandId) return;
    setSaving(true);
    const { data: brand } = await supabase
      .from("brands")
      .select("brand_settings_json")
      .eq("id", currentBrandId)
      .single();

    const existing = (brand?.brand_settings_json && typeof brand.brand_settings_json === "object"
      ? brand.brand_settings_json
      : {}) as Record<string, unknown>;

    const updated = { ...existing, offer_card_config: config };

    const { error } = await supabase
      .from("brands")
      .update({ brand_settings_json: updated as unknown as Json })
      .eq("id", currentBrandId);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: "Configuração de cards atualizada." });
    }
  };

  const updateTypeConfig = (type: keyof OfferCardConfig, patch: Partial<OfferTypeCardConfig>) => {
    setConfig((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  };

  const updateBadge = (type: keyof OfferCardConfig, badge: BadgeConfig) => {
    setConfig((prev) => ({ ...prev, [type]: { ...prev[type], badge } }));
  };

  const resetType = (type: keyof OfferCardConfig) => {
    setConfig((prev) => ({ ...prev, [type]: DEFAULT_CONFIG[type] }));
    toast({ title: "Restaurado", description: `Valores padrão restaurados para ${type}.` });
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Cards de Oferta" description="Configure os textos e badges exibidos nos cards de oferta do app" />

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-1.5">
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => {
          const typeConfig = config[tab.key];
          const sample = SAMPLE_DATA[tab.key];
          const vars = VARIABLES_HELP[tab.key];
          const isEmitter = tab.key === "emitter";

          return (
            <TabsContent key={tab.key} value={tab.key} className="space-y-4 mt-4">
              {/* Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Preview ao vivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-2xl overflow-hidden border border-border bg-muted/30">
                    <div className="p-4 space-y-1">
                      <p className="text-base font-bold text-foreground">
                        {applyTemplate(typeConfig.title_template || DEFAULT_CONFIG[tab.key].title_template, sample)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {applyTemplate(typeConfig.subtitle_template || DEFAULT_CONFIG[tab.key].subtitle_template, sample)}
                      </p>
                      {!isEmitter && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {applyTemplate(typeConfig.detail_template || DEFAULT_CONFIG[tab.key].detail_template, sample)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Templates */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Templates de texto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Título</Label>
                    <Input
                      value={typeConfig.title_template}
                      onChange={(e) => updateTypeConfig(tab.key, { title_template: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Subtítulo</Label>
                    <Input
                      value={typeConfig.subtitle_template}
                      onChange={(e) => updateTypeConfig(tab.key, { subtitle_template: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  {!isEmitter && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Detalhe (card expandido)</Label>
                      <Input
                        value={typeConfig.detail_template}
                        onChange={(e) => updateTypeConfig(tab.key, { detail_template: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {vars.map((v) => (
                      <code key={v} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{v}</code>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Badge config */}
              <BadgeConfigEditor
                value={typeConfig.badge}
                onChange={(badge) => updateBadge(tab.key, badge)}
              />

              {/* Reset */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetType(tab.key)}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar padrão
              </Button>
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar configuração"}
        </Button>
      </div>
    </div>
  );
}
