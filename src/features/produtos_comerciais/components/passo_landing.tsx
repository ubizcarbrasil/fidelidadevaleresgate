import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageUploadField from "@/components/ImageUploadField";
import type { ProdutoComercialDraft } from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

export default function PassoLanding({ draft, onChange }: Props) {
  const lc = draft.landing_config_json;
  const updateLanding = (patch: Partial<typeof lc>) =>
    onChange({ landing_config_json: { ...lc, ...patch } });

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Configure como a landing pública vai aparecer para quem clicar no link de divulgação.
      </p>

      <div className="space-y-2">
        <Label>Headline (título principal)</Label>
        <Input
          value={lc.headline ?? ""}
          onChange={(e) => updateLanding({ headline: e.target.value })}
          placeholder="A plataforma de fidelidade para motoristas"
        />
      </div>

      <div className="space-y-2">
        <Label>Subheadline</Label>
        <Textarea
          rows={2}
          value={lc.subheadline ?? ""}
          onChange={(e) => updateLanding({ subheadline: e.target.value })}
          placeholder="Acumule pontos, troque por descontos e dispute com seus colegas."
        />
      </div>

      <div className="space-y-2">
        <Label>Benefícios (uma linha por benefício)</Label>
        <Textarea
          rows={5}
          value={(lc.benefits ?? []).join("\n")}
          onChange={(e) =>
            updateLanding({ benefits: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
          }
          placeholder="Achadinhos exclusivos&#10;Resgate em parceiros&#10;Duelo com motoristas da cidade"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cor primária</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={lc.primary_color ?? "#6366f1"}
              onChange={(e) => updateLanding({ primary_color: e.target.value })}
              className="h-10 w-10 rounded border cursor-pointer"
            />
            <Input
              value={lc.primary_color ?? ""}
              onChange={(e) => updateLanding({ primary_color: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Texto do botão CTA</Label>
          <Input
            value={lc.cta_label ?? ""}
            onChange={(e) => updateLanding({ cta_label: e.target.value })}
            placeholder="Começar trial 30 dias grátis"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Imagem do hero</Label>
        <ImageUploadField
          value={lc.hero_image_url ?? ""}
          onChange={(url) => updateLanding({ hero_image_url: url })}
          folder="product-landings"
          label="Imagem"
          previewClassName="h-32 object-contain"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-2 rounded-md border p-3">
          <Switch
            checked={draft.is_popular}
            onCheckedChange={(v) => onChange({ is_popular: v })}
          />
          <Label>Destacar como "Mais popular"</Label>
        </div>
        <div className="flex items-center gap-2 rounded-md border p-3">
          <Switch
            checked={draft.is_public_listed}
            onCheckedChange={(v) => onChange({ is_public_listed: v })}
          />
          <Label>Listar no catálogo público (/produtos)</Label>
        </div>
      </div>
    </div>
  );
}
