import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Palette, Type, Image, FileText, Smartphone, Sun, Moon, Wand2 } from "lucide-react";
import type { BrandTheme } from "@/hooks/useBrandTheme";
import ImageUploadField from "@/components/ImageUploadField";
import BrandThemePreview from "@/components/BrandThemePreview";
import OfferCardConfigSection from "@/components/OfferCardConfigSection";
import type { OfferCardConfig } from "@/hooks/useOfferCardConfig";
import { DEFAULT_CONFIG } from "@/hooks/useOfferCardConfig";

interface BrandThemeEditorProps {
  value: BrandTheme;
  onChange: (theme: BrandTheme) => void;
  brandId?: string;
  brandName?: string;
  offerCardConfig?: OfferCardConfig;
  onOfferCardConfigChange?: (config: OfferCardConfig) => void;
}

const COLOR_FIELDS: { key: keyof NonNullable<BrandTheme["colors"]>; label: string }[] = [
  { key: "primary", label: "Primária (painel admin)" },
  { key: "secondary", label: "Secundária (identidade do app)" },
  { key: "accent", label: "Destaque" },
  { key: "background", label: "Fundo" },
  { key: "foreground", label: "Texto" },
  { key: "muted", label: "Suave" },
  { key: "card", label: "Card" },
];

function hslToHex(hsl: string): string {
  if (!hsl) return "#6366f1";
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return "#6366f1";
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const DARK_DEFAULTS: NonNullable<BrandTheme["colors"]> = {
  background: "222 47% 7%",
  foreground: "0 0% 100%",
  card: "222 47% 11%",
  muted: "222 47% 15%",
  accent: "45 100% 55%",
};

interface DarkPreset {
  name: string;
  description: string;
  colors: NonNullable<BrandTheme["dark_colors"]>;
}

const DARK_PRESETS: DarkPreset[] = [
  {
    name: "Escuro Elegante",
    description: "Fundo profundo com destaques suaves em dourado",
    colors: {
      background: "222 47% 7%",
      foreground: "0 0% 98%",
      card: "222 40% 10%",
      muted: "222 30% 14%",
      accent: "38 92% 55%",
      secondary: "38 92% 55%",
      primary: "222 50% 55%",
    },
  },
  {
    name: "Escuro Vibrante",
    description: "Fundo escuro com destaques em laranja vivo",
    colors: {
      background: "240 10% 6%",
      foreground: "0 0% 100%",
      card: "240 10% 10%",
      muted: "240 8% 15%",
      accent: "25 95% 55%",
      secondary: "25 95% 55%",
      primary: "262 83% 58%",
    },
  },
  {
    name: "Meia-noite Azul",
    description: "Tom azul marinho sofisticado com ciano",
    colors: {
      background: "220 40% 8%",
      foreground: "210 40% 96%",
      card: "220 35% 12%",
      muted: "220 25% 16%",
      accent: "190 90% 50%",
      secondary: "190 90% 50%",
      primary: "220 60% 55%",
    },
  },
  {
    name: "Escuro Rosé",
    description: "Fundo quente com destaques em rosa e rosa-claro",
    colors: {
      background: "280 15% 7%",
      foreground: "0 0% 97%",
      card: "280 12% 11%",
      muted: "280 10% 16%",
      accent: "340 82% 60%",
      secondary: "340 82% 60%",
      primary: "280 60% 55%",
    },
  },
];

export default function BrandThemeEditor({ value, onChange, brandId, brandName, offerCardConfig, onOfferCardConfigChange }: BrandThemeEditorProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [colorMode, setColorMode] = useState<"light" | "dark">("light");
  const update = (patch: Partial<BrandTheme>) => onChange({ ...value, ...patch });
  const folder = brandId ? `brands/${brandId}` : `brands/new-${Date.now()}`;

  const isEditingDark = colorMode === "dark";
  const lightColors = value.colors || {};
  const { background: _bg, foreground: _fg, card: _card, muted: _mut, ...lightAccents } = lightColors;
  const currentPalette = isEditingDark
    ? { ...DARK_DEFAULTS, ...lightAccents, ...value.dark_colors }
    : lightColors;

  const updateColor = (key: string, hex: string) => {
    const hsl = hexToHsl(hex);
    if (isEditingDark) {
      update({ dark_colors: { ...value.dark_colors, [key]: hsl } });
    } else {
      update({ colors: { ...value.colors, [key]: hsl } });
    }
  };

  const updateColorHsl = (key: string, hsl: string) => {
    if (isEditingDark) {
      update({ dark_colors: { ...value.dark_colors, [key]: hsl } });
    } else {
      update({ colors: { ...value.colors, [key]: hsl } });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Mobile preview FAB */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full shadow-xl h-14 w-14 p-0">
              <Smartphone className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Preview do App</SheetTitle>
            </SheetHeader>
            <div className="flex justify-center py-4">
              <BrandThemePreview theme={value} brandName={brandName || ""} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="space-y-6">
      {/* Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4" /> Cores
          </CardTitle>
          {/* Light / Dark toggle */}
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => setColorMode("light")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                !isEditingDark
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              Modo Claro
            </button>
            <button
              onClick={() => setColorMode("dark")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                isEditingDark
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              Modo Escuro
            </button>
          </div>
          {isEditingDark && (
            <div className="space-y-2 mt-1.5">
              <p className="text-[11px] text-muted-foreground">
                Configure as cores do modo escuro. Use um preset como ponto de partida ou personalize manualmente.
              </p>
              {/* Dark presets */}
              <div className="grid grid-cols-2 gap-2">
                {DARK_PRESETS.map((preset) => {
                  const presetBg = `hsl(${preset.colors.background})`;
                  const presetAccent = `hsl(${preset.colors.accent || preset.colors.secondary || "45 100% 55%"})`;
                  const presetFg = `hsl(${preset.colors.foreground || "0 0% 100%"})`;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => update({ dark_colors: { ...preset.colors } })}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 transition-colors text-left group"
                    >
                      {/* Color preview dots */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <div className="flex gap-0.5">
                          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: presetBg }} />
                          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: presetAccent }} />
                        </div>
                        <div className="flex gap-0.5">
                          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: `hsl(${preset.colors.card || "222 47% 11%"})` }} />
                          <div className="h-4 w-4 rounded-sm border border-border/30" style={{ backgroundColor: presetFg }} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold truncate flex items-center gap-1">
                          <Wand2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          {preset.name}
                        </p>
                        <p className="text-[9px] text-muted-foreground truncate">{preset.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {COLOR_FIELDS.map(({ key, label }) => {
              const hslValue = currentPalette[key] || "";
              const hexValue = hslValue ? hslToHex(hslValue) : "";
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={hexValue || "#6366f1"}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="h-9 w-9 rounded border border-input cursor-pointer shrink-0 p-0.5"
                    />
                    <Input
                      value={hslValue}
                      onChange={(e) => updateColorHsl(key, e.target.value)}
                      placeholder="220 70% 50%"
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Type className="h-4 w-4" /> Tipografia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Fonte de títulos (Google Fonts)</Label>
              <Input
                value={value.font_heading || ""}
                onChange={(e) => update({ font_heading: e.target.value || undefined })}
                placeholder="Ex: Poppins, Montserrat, Playfair Display"
              />
              {value.font_heading && (
                <p
                  className="text-sm text-muted-foreground"
                  style={{ fontFamily: `"${value.font_heading}", sans-serif` }}
                >
                  Preview: {value.font_heading}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fonte do corpo (Google Fonts)</Label>
              <Input
                value={value.font_body || ""}
                onChange={(e) => update({ font_body: e.target.value || undefined })}
                placeholder="Ex: Inter, Open Sans, Roboto"
              />
              {value.font_body && (
                <p
                  className="text-sm text-muted-foreground"
                  style={{ fontFamily: `"${value.font_body}", sans-serif` }}
                >
                  Preview: {value.font_body}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Image className="h-4 w-4" /> Imagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Logo</Label>
              <p className="text-[10px] text-muted-foreground">Aparece no cabeçalho do app e ícone PWA</p>
              <ImageUploadField
                value={value.logo_url || ""}
                onChange={(url) => update({ logo_url: url || undefined })}
                folder={`${folder}/logo`}
                previewClassName="h-10 object-contain"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Favicon</Label>
              <p className="text-[10px] text-muted-foreground">Ícone da aba do navegador</p>
              <ImageUploadField
                value={value.favicon_url || ""}
                onChange={(url) => update({ favicon_url: url || undefined })}
                folder={`${folder}/favicon`}
                accept="image/png,image/x-icon,image/svg+xml"
                previewClassName="h-8 w-8 object-contain"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Imagem de fundo</Label>
            <p className="text-[10px] text-muted-foreground">Fundo do banner de pontos e tela de login</p>
            <ImageUploadField
              value={value.background_image_url || ""}
              onChange={(url) => update({ background_image_url: url || undefined })}
              folder={`${folder}/background`}
              previewClassName="h-16 object-cover w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Texts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Textos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Nome de exibição</Label>
              <Input
                value={value.display_name || ""}
                onChange={(e) => update({ display_name: e.target.value || undefined })}
                placeholder="Nome visível para o cliente"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Slogan</Label>
              <Input
                value={value.slogan || ""}
                onChange={(e) => update({ slogan: e.target.value || undefined })}
                placeholder="Frase de destaque"
              />
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label className="text-xs">Texto do rodapé</Label>
            <Input
              value={value.footer_text || ""}
              onChange={(e) => update({ footer_text: e.target.value || undefined })}
              placeholder="© 2026 Minha Marca. Todos os direitos reservados."
            />
          </div>
        </CardContent>
      </Card>

      {/* Offer Card Config */}
      {onOfferCardConfigChange && offerCardConfig && (
        <OfferCardConfigSection
          value={offerCardConfig}
          onChange={onOfferCardConfigChange}
        />
      )}
      </div>

      {/* Live Preview - sticky sidebar */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <BrandThemePreview theme={value} brandName={brandName || ""} />
      </div>
    </div>
  );
}
