import { useEffect, useState } from "react";
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
  // Estado local em string para os campos de preço — evita o input "saltar"
  // ao reformatar a cada tecla (que travava a edição do valor).
  const centsToStr = (c: number | null | undefined) =>
    c == null ? "" : (c / 100).toFixed(2).replace(".", ",");

  const [precoMensalStr, setPrecoMensalStr] = useState(() =>
    draft.price_cents > 0 ? centsToStr(draft.price_cents) : "",
  );
  const [precoAnualStr, setPrecoAnualStr] = useState(() => centsToStr(draft.price_yearly_cents));

  // Ressincroniza quando o draft muda de fora (ex: trocar de produto, template)
  useEffect(() => {
    setPrecoMensalStr(draft.price_cents > 0 ? centsToStr(draft.price_cents) : "");
    setPrecoAnualStr(centsToStr(draft.price_yearly_cents));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id]);

  const parseToCents = (raw: string): number => {
    const normalized = raw.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  };

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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Preços</Label>
          {(() => {
            if (draft.price_cents <= 0 || draft.price_yearly_cents == null) return null;
            const mensalAno = draft.price_cents * 12;
            if (draft.price_yearly_cents > mensalAno) {
              return (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                  ⚠ Anual maior que 12× mensal
                </span>
              );
            }
            const desc = Math.round(((mensalAno - draft.price_yearly_cents) / mensalAno) * 100);
            if (desc <= 0) return null;
            return (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                {desc}% de desconto vs mensal
              </span>
            );
          })()}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Preço mensal (R$) *</Label>
            <Input
              inputMode="decimal"
              value={precoMensalStr}
              placeholder="0,00"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.,]/g, "");
                setPrecoMensalStr(v);
                onChange({ price_cents: parseToCents(v) });
              }}
              onBlur={() => {
                if (precoMensalStr.trim() === "") return;
                setPrecoMensalStr(centsToStr(parseToCents(precoMensalStr)));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Preço anual (R$)</Label>
            <Input
              inputMode="decimal"
              value={precoAnualStr}
              placeholder="opcional"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.,]/g, "");
                setPrecoAnualStr(v);
                onChange({ price_yearly_cents: v === "" ? null : parseToCents(v) });
              }}
              onBlur={() => {
                if (precoAnualStr.trim() === "") {
                  onChange({ price_yearly_cents: null });
                  return;
                }
                setPrecoAnualStr(centsToStr(parseToCents(precoAnualStr)));
              }}
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
