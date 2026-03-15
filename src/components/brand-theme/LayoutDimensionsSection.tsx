import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Ruler } from "lucide-react";
import type { BrandLayoutConfig } from "@/hooks/useBrandTheme";

interface Props {
  value: BrandLayoutConfig;
  onChange: (layout: BrandLayoutConfig) => void;
}

const FIELDS: {
  key: keyof BrandLayoutConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultVal: number;
  unit: string;
}[] = [
  { key: "card_border_radius", label: "Border-radius dos cards", min: 0, max: 32, step: 1, defaultVal: 12, unit: "px" },
  { key: "card_image_height", label: "Altura da imagem dos cards", min: 80, max: 240, step: 4, defaultVal: 140, unit: "px" },
  { key: "category_icon_size", label: "Tamanho do ícone de categoria", min: 40, max: 80, step: 2, defaultVal: 64, unit: "px" },
  { key: "category_icon_radius", label: "Raio do ícone de categoria", min: 4, max: 50, step: 1, defaultVal: 16, unit: "px" },
  { key: "category_font_size", label: "Tamanho da fonte de categoria", min: 8, max: 16, step: 1, defaultVal: 11, unit: "px" },
  { key: "button_radius", label: "Raio dos botões", min: 0, max: 24, step: 1, defaultVal: 8, unit: "px" },
  { key: "section_title_size", label: "Tamanho do título de seção", min: 12, max: 24, step: 1, defaultVal: 16, unit: "px" },
];

export default function LayoutDimensionsSection({ value, onChange }: Props) {
  const update = (key: keyof BrandLayoutConfig, val: number) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Ruler className="h-4 w-4" /> Layout e Dimensões
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Ajuste tamanhos, raios e proporções dos elementos visuais do app.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {FIELDS.map(({ key, label, min, max, step, defaultVal, unit }) => {
          const current = value[key] ?? defaultVal;
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                  {current}{unit}
                </span>
              </div>
              <Slider
                min={min}
                max={max}
                step={step}
                value={[current]}
                onValueChange={([v]) => update(key, v)}
                className="w-full"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
