import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProdutoComercialDraft } from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

export default function PassoLandingBeneficios({ draft, onChange }: Props) {
  const lc = draft.landing_config_json;
  const updateLanding = (patch: Partial<typeof lc>) =>
    onChange({ landing_config_json: { ...lc, ...patch } });

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Liste os benefícios principais — uma linha por benefício. Aparecem no card "O que está incluso".
      </p>
      <div className="space-y-2">
        <Label>Benefícios</Label>
        <Textarea
          rows={8}
          value={(lc.benefits ?? []).join("\n")}
          onChange={(e) =>
            updateLanding({
              benefits: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="Achadinhos exclusivos&#10;Resgate em parceiros&#10;Duelo com motoristas da cidade"
        />
        <p className="text-xs text-muted-foreground">
          {(lc.benefits ?? []).length} benefício(s) cadastrado(s).
        </p>
      </div>
    </div>
  );
}
