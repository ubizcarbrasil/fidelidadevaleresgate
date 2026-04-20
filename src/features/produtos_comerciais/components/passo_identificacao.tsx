import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ProdutoComercialDraft } from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function PassoIdentificacao({ draft, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome comercial do produto *</Label>
          <Input
            value={draft.product_name}
            onChange={(e) => {
              const v = e.target.value;
              onChange({
                product_name: v,
                // auto-preenche slug e plan_key se estiverem vazios
                slug: draft.slug || slugify(v),
                plan_key: draft.plan_key || slugify(v),
                label: draft.label || v,
              });
            }}
            placeholder="Vale Resgate Motorista Premium"
          />
          <p className="text-xs text-muted-foreground">Aparece na landing pública.</p>
        </div>
        <div className="space-y-2">
          <Label>Nome interno do plano *</Label>
          <Input
            value={draft.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Motorista Premium"
          />
          <p className="text-xs text-muted-foreground">Usado no painel administrativo.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Chave técnica (plan_key) *</Label>
          <Input
            value={draft.plan_key}
            onChange={(e) => onChange({ plan_key: slugify(e.target.value) })}
            placeholder="motorista-premium"
            disabled={!!draft.id}
          />
          <p className="text-xs text-muted-foreground">
            {draft.id ? "Não editável após criação." : "Identificador único interno."}
          </p>
        </div>
        <div className="space-y-2">
          <Label>Slug da landing *</Label>
          <Input
            value={draft.slug}
            onChange={(e) => onChange({ slug: slugify(e.target.value) })}
            placeholder="motorista-premium"
          />
          <p className="text-xs text-muted-foreground">URL: /p/produto/{draft.slug || "..."}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Preço mensal (R$) *</Label>
          <Input
            type="number"
            step="0.01"
            value={(draft.price_cents / 100).toFixed(2)}
            onChange={(e) =>
              onChange({ price_cents: Math.round(parseFloat(e.target.value || "0") * 100) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Preço anual (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={draft.price_yearly_cents != null ? (draft.price_yearly_cents / 100).toFixed(2) : ""}
            onChange={(e) => {
              const raw = e.target.value;
              onChange({
                price_yearly_cents: raw === "" ? null : Math.round(parseFloat(raw) * 100),
              });
            }}
            placeholder="opcional"
          />
        </div>
        <div className="space-y-2">
          <Label>Trial (dias) *</Label>
          <Input
            type="number"
            value={draft.trial_days}
            onChange={(e) => onChange({ trial_days: parseInt(e.target.value || "30") })}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-2 rounded-md border p-3">
          <Switch
            checked={draft.is_active}
            onCheckedChange={(v) => onChange({ is_active: v })}
          />
          <Label>Ativo (disponível para venda)</Label>
        </div>
        <div className="space-y-2">
          <Label>Ordem de exibição</Label>
          <Input
            type="number"
            value={draft.sort_order}
            onChange={(e) => onChange({ sort_order: parseInt(e.target.value || "100") })}
          />
        </div>
      </div>
    </div>
  );
}
