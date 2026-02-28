import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Palette, Type, Image, FileText } from "lucide-react";
import type { BrandTheme } from "@/hooks/useBrandTheme";

interface BrandThemeEditorProps {
  value: BrandTheme;
  onChange: (theme: BrandTheme) => void;
}

const COLOR_FIELDS: { key: keyof NonNullable<BrandTheme["colors"]>; label: string }[] = [
  { key: "primary", label: "Primária" },
  { key: "secondary", label: "Secundária" },
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

export default function BrandThemeEditor({ value, onChange }: BrandThemeEditorProps) {
  const update = (patch: Partial<BrandTheme>) => onChange({ ...value, ...patch });
  const updateColor = (key: string, hex: string) => {
    update({ colors: { ...value.colors, [key]: hexToHsl(hex) } });
  };

  return (
    <div className="space-y-6">
      {/* Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4" /> Cores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {COLOR_FIELDS.map(({ key, label }) => {
              const hslValue = value.colors?.[key] || "";
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
                      onChange={(e) =>
                        update({ colors: { ...value.colors, [key]: e.target.value } })
                      }
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
            <div className="space-y-2">
              <Label className="text-xs">URL do Logo</Label>
              <Input
                value={value.logo_url || ""}
                onChange={(e) => update({ logo_url: e.target.value || undefined })}
                placeholder="https://..."
              />
              {value.logo_url && (
                <img src={value.logo_url} alt="Logo preview" className="h-10 object-contain mt-1 rounded border border-input p-1" />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">URL do Favicon</Label>
              <Input
                value={value.favicon_url || ""}
                onChange={(e) => update({ favicon_url: e.target.value || undefined })}
                placeholder="https://..."
              />
              {value.favicon_url && (
                <img src={value.favicon_url} alt="Favicon preview" className="h-8 w-8 object-contain mt-1 rounded border border-input p-1" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">URL da imagem de fundo</Label>
            <Input
              value={value.background_image_url || ""}
              onChange={(e) => update({ background_image_url: e.target.value || undefined })}
              placeholder="https://..."
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
    </div>
  );
}
