import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Sparkles, Star, Percent, Zap, Gift, Heart, Award } from "lucide-react";
import type { BadgeConfig } from "@/hooks/useBrandTheme";

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

interface BadgeConfigEditorProps {
  value: BadgeConfig;
  onChange: (config: BadgeConfig) => void;
  showPreview?: boolean;
}

export default function BadgeConfigEditor({ value, onChange, showPreview = true }: BadgeConfigEditorProps) {
  const update = (patch: Partial<BadgeConfig>) => onChange({ ...value, ...patch });

  const bgColor = value.bg_color || "#6366f1";
  const textColor = value.text_color || "#FFFFFF";
  const textTemplate = value.text_template || "Pague {percent}% com Pontos";
  const iconName = value.icon || "sparkles";
  const SelectedIcon = ICON_OPTIONS.find(o => o.value === iconName)?.Icon || Sparkles;

  const previewText = textTemplate.replace("{percent}", "30");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Tag className="h-4 w-4" /> Etiqueta de Desconto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        {showPreview && (
          <div className="flex items-center justify-center py-4 px-3 rounded-xl bg-muted/50">
            <div
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              <SelectedIcon className="h-3 w-3" />
              {previewText}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Background color */}
          <div className="space-y-1.5">
            <Label className="text-xs">Cor de fundo</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => update({ bg_color: e.target.value })}
                className="h-9 w-9 rounded border border-input cursor-pointer shrink-0 p-0.5"
              />
              <Input
                value={value.bg_color || ""}
                onChange={(e) => update({ bg_color: e.target.value })}
                placeholder="#6366f1"
                className="text-xs h-9 font-mono"
              />
            </div>
          </div>

          {/* Text color */}
          <div className="space-y-1.5">
            <Label className="text-xs">Cor do texto</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => update({ text_color: e.target.value })}
                className="h-9 w-9 rounded border border-input cursor-pointer shrink-0 p-0.5"
              />
              <Input
                value={value.text_color || ""}
                onChange={(e) => update({ text_color: e.target.value })}
                placeholder="#FFFFFF"
                className="text-xs h-9 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Text template */}
        <div className="space-y-1.5">
          <Label className="text-xs">Texto da etiqueta</Label>
          <Input
            value={value.text_template || ""}
            onChange={(e) => update({ text_template: e.target.value })}
            placeholder="Pague {percent}% com Pontos"
            className="text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            Use <code className="bg-muted px-1 rounded">{"{percent}"}</code> para inserir o valor do desconto automaticamente.
          </p>
        </div>

        {/* Icon picker */}
        <div className="space-y-1.5">
          <Label className="text-xs">Ícone</Label>
          <div className="flex gap-2 flex-wrap">
            {ICON_OPTIONS.map(({ value: iconVal, label, Icon }) => (
              <button
                key={iconVal}
                type="button"
                onClick={() => update({ icon: iconVal })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  iconName === iconVal
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ICON_OPTIONS };
