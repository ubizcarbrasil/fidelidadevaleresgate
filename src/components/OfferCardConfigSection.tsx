import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tag, Store, ShoppingBag, Zap, RotateCcw, Info, Sparkles, Star, Percent, Gift, Heart, Award } from "lucide-react";
import type { OfferCardConfig, OfferTypeCardConfig } from "@/hooks/useOfferCardConfig";
import { DEFAULT_CONFIG } from "@/hooks/useOfferCardConfig";
import type { BadgeConfig } from "@/hooks/useBrandTheme";
import { toast } from "@/hooks/use-toast";

const ICON_OPTIONS = [
  { value: "sparkles", label: "Sparkles", Icon: Sparkles },
  { value: "tag", label: "Tag", Icon: Tag },
  { value: "percent", label: "Percent", Icon: Percent },
  { value: "star", label: "Star", Icon: Star },
  { value: "zap", label: "Zap", Icon: Zap },
  { value: "gift", label: "Gift", Icon: Gift },
  { value: "heart", label: "Heart", Icon: Heart },
  { value: "award", label: "Award", Icon: Award },
];

const TABS_CONFIG = [
  { key: "store" as const, label: "Loja Toda", icon: Store },
  { key: "product" as const, label: "Produto", icon: ShoppingBag },
  { key: "emitter" as const, label: "Emissor", icon: Zap },
];

const SAMPLE_DATA: Record<string, Record<string, number | string>> = {
  store: { credit: 15, points: 15, percent: 0, min: 30, points_per_real: 0, store_name: "Pizzaria do João" },
  product: { credit: 25, points: 25, percent: 30, min: 50, points_per_real: 0, store_name: "Loja do Centro" },
  emitter: { credit: 0, points: 0, percent: 0, min: 0, points_per_real: 2, store_name: "Auto Posto" },
};

const VARIABLES_HELP: Record<string, { var: string; desc: string }[]> = {
  store: [
    { var: "{credit}", desc: "Valor em R$" },
    { var: "{points}", desc: "Pontos" },
    { var: "{min}", desc: "Compra mínima" },
    { var: "{store_name}", desc: "Nome da loja" },
  ],
  product: [
    { var: "{credit}", desc: "Valor em R$" },
    { var: "{points}", desc: "Pontos" },
    { var: "{percent}", desc: "% desconto" },
    { var: "{min}", desc: "Compra mínima" },
    { var: "{store_name}", desc: "Nome da loja" },
  ],
  emitter: [
    { var: "{points_per_real}", desc: "Pts por R$" },
    { var: "{store_name}", desc: "Nome da loja" },
  ],
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

interface OfferCardConfigSectionProps {
  value: OfferCardConfig;
  onChange: (config: OfferCardConfig) => void;
}

export default function OfferCardConfigSection({ value, onChange }: OfferCardConfigSectionProps) {
  const updateTypeConfig = (type: keyof OfferCardConfig, patch: Partial<OfferTypeCardConfig>) => {
    onChange({ ...value, [type]: { ...value[type], ...patch } });
  };

  const updateBadge = (type: keyof OfferCardConfig, badge: BadgeConfig) => {
    onChange({ ...value, [type]: { ...value[type], badge } });
  };

  const resetType = (type: keyof OfferCardConfig) => {
    onChange({ ...value, [type]: DEFAULT_CONFIG[type] });
    toast({ title: "Restaurado", description: `Valores padrão restaurados.` });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" /> Etiquetas e Cards de Oferta
        </CardTitle>
        <p className="text-[11px] text-muted-foreground mt-1">
          Configure os textos, cores e ícones das etiquetas que aparecem sobre os cards de oferta no app. Cada tipo de oferta pode ter sua própria configuração.
        </p>
        <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-muted/50 border border-border">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong>Hierarquia:</strong> Ofertas individuais podem sobrescrever estas configurações. 
            Prioridade: <span className="font-medium">Oferta individual</span> → <span className="font-medium">Tipo (abaixo)</span> → <span className="font-medium">Cor primária da marca</span>
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="store" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            {TABS_CONFIG.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-1.5 text-xs">
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS_CONFIG.map((tab) => {
            const typeConfig = value[tab.key];
            const sample = SAMPLE_DATA[tab.key];
            const vars = VARIABLES_HELP[tab.key];
            const isEmitter = tab.key === "emitter";
            const badge = typeConfig.badge;
            const bgColor = badge.bg_color || "#6366f1";
            const textColor = badge.text_color || "#FFFFFF";
            const iconName = badge.icon || "sparkles";
            const SelectedIcon = ICON_OPTIONS.find(o => o.value === iconName)?.Icon || Sparkles;
            const badgeText = badge.text_template || DEFAULT_CONFIG[tab.key].badge.text_template || "";
            const previewBadgeText = applyTemplate(badgeText, sample);

            return (
              <TabsContent key={tab.key} value={tab.key} className="space-y-4 mt-4">
                {/* Live Preview */}
                <div className="rounded-2xl overflow-hidden border border-border bg-muted/30">
                  <div className="relative h-28 bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
                    {previewBadgeText && (
                      <div className="absolute top-2.5 left-2.5">
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: bgColor, color: textColor }}
                        >
                          <SelectedIcon className="h-2.5 w-2.5" />
                          {previewBadgeText}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5 space-y-0.5">
                    <p className="text-xs font-bold text-foreground">
                      {applyTemplate(typeConfig.title_template || DEFAULT_CONFIG[tab.key].title_template, sample)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {applyTemplate(typeConfig.subtitle_template || DEFAULT_CONFIG[tab.key].subtitle_template, sample)}
                    </p>
                    {!isEmitter && typeConfig.detail_template && (
                      <p className="text-[10px] text-muted-foreground/70">
                        {applyTemplate(typeConfig.detail_template || DEFAULT_CONFIG[tab.key].detail_template, sample)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badge Config */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">Etiqueta</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Cor de fundo</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => updateBadge(tab.key, { ...badge, bg_color: e.target.value })}
                          className="h-8 w-8 rounded border border-input cursor-pointer shrink-0 p-0.5"
                        />
                        <Input
                          value={badge.bg_color || ""}
                          onChange={(e) => updateBadge(tab.key, { ...badge, bg_color: e.target.value })}
                          placeholder="#6366f1"
                          className="text-[11px] h-8 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Cor do texto</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => updateBadge(tab.key, { ...badge, text_color: e.target.value })}
                          className="h-8 w-8 rounded border border-input cursor-pointer shrink-0 p-0.5"
                        />
                        <Input
                          value={badge.text_color || ""}
                          onChange={(e) => updateBadge(tab.key, { ...badge, text_color: e.target.value })}
                          placeholder="#FFFFFF"
                          className="text-[11px] h-8 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Texto da etiqueta</Label>
                    <Input
                      value={badge.text_template || ""}
                      onChange={(e) => updateBadge(tab.key, { ...badge, text_template: e.target.value })}
                      placeholder={DEFAULT_CONFIG[tab.key].badge.text_template}
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Ícone</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ICON_OPTIONS.map(({ value: iconVal, label, Icon }) => (
                        <button
                          key={iconVal}
                          type="button"
                          onClick={() => updateBadge(tab.key, { ...badge, icon: iconVal })}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                            iconName === iconVal
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text Templates */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">Templates de texto</Label>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Título</Label>
                      <Input
                        value={typeConfig.title_template}
                        onChange={(e) => updateTypeConfig(tab.key, { title_template: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Subtítulo</Label>
                      <Input
                        value={typeConfig.subtitle_template}
                        onChange={(e) => updateTypeConfig(tab.key, { subtitle_template: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                    {!isEmitter && (
                      <div className="space-y-1">
                        <Label className="text-[11px]">Detalhe (card expandido)</Label>
                        <Input
                          value={typeConfig.detail_template}
                          onChange={(e) => updateTypeConfig(tab.key, { detail_template: e.target.value })}
                          className="text-xs h-8"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {vars.map((v) => (
                      <span key={v.var} className="inline-flex items-center gap-1 text-[9px] bg-muted px-1.5 py-0.5 rounded">
                        <code className="font-mono font-bold">{v.var}</code>
                        <span className="text-muted-foreground">{v.desc}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetType(tab.key)}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar padrão
                </Button>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
