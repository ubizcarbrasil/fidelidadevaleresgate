import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { ProdutoComercialDraft } from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

export default function PassoLandingBeneficios({ draft, onChange }: Props) {
  const lc = draft.landing_config_json;
  const updateLanding = (patch: Partial<typeof lc>) =>
    onChange({ landing_config_json: { ...lc, ...patch } });

  const benefitsAsStrings = (lc.benefits ?? []).map((b) =>
    typeof b === "string" ? b : b.title,
  );

  const metrics = lc.metrics ?? [];
  const problems = lc.problems ?? [];
  const solutions = lc.solutions ?? [];

  const addMetric = () =>
    updateLanding({ metrics: [...metrics, { value: "", label: "" }] });
  const updateMetric = (i: number, patch: Partial<{ value: string; label: string }>) => {
    const next = [...metrics];
    next[i] = { ...next[i], ...patch };
    updateLanding({ metrics: next });
  };
  const removeMetric = (i: number) =>
    updateLanding({ metrics: metrics.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-7">
      {/* Eyebrow */}
      <div className="space-y-2">
        <Label>Eyebrow (tag acima do título)</Label>
        <Input
          value={lc.eyebrow ?? ""}
          onChange={(e) => updateLanding({ eyebrow: e.target.value })}
          placeholder="Ex.: PARA EMPRESAS DE MOBILIDADE"
          maxLength={60}
        />
        <p className="text-xs text-muted-foreground">
          Pequena etiqueta que aparece bem no topo da landing. Padrão: "PARA EMPRESAS DE MOBILIDADE".
        </p>
      </div>

      {/* Benefícios */}
      <div className="space-y-2">
        <Label>Benefícios principais</Label>
        <Textarea
          rows={6}
          value={benefitsAsStrings.join("\n")}
          onChange={(e) =>
            updateLanding({
              benefits: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="Achadinhos exclusivos&#10;Resgate em parceiros&#10;Duelo com motoristas da cidade"
        />
        <p className="text-xs text-muted-foreground">
          Uma linha por benefício. Aparecem no grid "Tudo o que está incluso".
          {benefitsAsStrings.length > 0 && ` ${benefitsAsStrings.length} cadastrado(s).`}
        </p>
      </div>

      {/* Métricas de impacto */}
      <div className="space-y-2 border-t pt-5">
        <div className="flex items-center justify-between">
          <Label>Métricas de impacto (opcional)</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={addMetric}
            disabled={metrics.length >= 4}
            className="gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Até 4 números de destaque (ex.: "+30%" / "engajamento"). Se vazio, a seção fica oculta.
        </p>
        {metrics.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma métrica cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {metrics.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
                <Input
                  value={m.value}
                  onChange={(e) => updateMetric(i, { value: e.target.value })}
                  placeholder="+30%"
                  maxLength={12}
                />
                <Input
                  value={m.label}
                  onChange={(e) => updateMetric(i, { label: e.target.value })}
                  placeholder="engajamento"
                  maxLength={40}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeMetric(i)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dores que resolve */}
      <div className="space-y-2 border-t pt-5">
        <Label>Dores que você resolve (opcional)</Label>
        <Textarea
          rows={4}
          value={problems.join("\n")}
          onChange={(e) =>
            updateLanding({
              problems: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="Motorista perde engajamento depois de 3 meses&#10;Difícil saber quem são os clientes mais fiéis&#10;Nenhuma régua de premiação organizada"
        />
        <p className="text-xs text-muted-foreground">
          Uma dor por linha. Aparece na coluna esquerda da seção "Antes vs Depois".
        </p>
      </div>

      {/* Como você resolve */}
      <div className="space-y-2">
        <Label>Como você resolve (opcional)</Label>
        <Textarea
          rows={4}
          value={solutions.join("\n")}
          onChange={(e) =>
            updateLanding({
              solutions: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })
          }
          placeholder="Programa de fidelidade automático com pontos por corrida&#10;Ranking público de motoristas — gamificação real&#10;Resgates locais que mantêm o motorista voltando"
        />
        <p className="text-xs text-muted-foreground">
          Uma solução por linha. Aparece na coluna direita da seção "Antes vs Depois".
          Se Dores e Soluções estiverem vazias, a seção inteira fica oculta.
        </p>
      </div>
    </div>
  );
}
