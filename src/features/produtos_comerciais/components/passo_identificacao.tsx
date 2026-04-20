import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings2, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  // Modo avançado revela campos técnicos (plan_key e slug editável manualmente)
  // Em edição, abre por padrão para não esconder dados existentes.
  const [modoAvancado, setModoAvancado] = useState(!!draft.id);

  const [precoMensalStr, setPrecoMensalStr] = useState(() =>
    draft.price_cents > 0 ? centsToStr(draft.price_cents) : "",
  );
  const [precoAnualStr, setPrecoAnualStr] = useState(() => centsToStr(draft.price_yearly_cents));

  // Foco controla se devemos respeitar a digitação do usuário (não sobrescrever)
  const [mensalFocado, setMensalFocado] = useState(false);
  const [anualFocado, setAnualFocado] = useState(false);

  // Sincronia bidirecional: draft.price_cents é a fonte de verdade.
  // Só ressincroniza o input quando NÃO está focado, para não atrapalhar a digitação.
  useEffect(() => {
    if (mensalFocado) return;
    setPrecoMensalStr(draft.price_cents > 0 ? centsToStr(draft.price_cents) : "");
  }, [draft.price_cents, mensalFocado]);

  useEffect(() => {
    if (anualFocado) return;
    setPrecoAnualStr(centsToStr(draft.price_yearly_cents));
  }, [draft.price_yearly_cents, anualFocado]);

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
          <p className="text-xs text-muted-foreground">
            Aparece na landing pública. Identificadores técnicos serão gerados automaticamente.
          </p>
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

      {/* Identificadores técnicos — escondidos por padrão */}
      <div className="rounded-md border bg-muted/20">
        <button
          type="button"
          onClick={() => setModoAvancado((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Identificadores técnicos {modoAvancado ? "(ocultar)" : "(avançado)"}
          </span>
          <span className="text-[10px] uppercase tracking-wide">
            {modoAvancado ? "−" : "+"}
          </span>
        </button>
        {modoAvancado && (
          <TooltipProvider delayDuration={150}>
            <div className="grid sm:grid-cols-2 gap-4 border-t p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs">ID interno (não muda)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="O que é o ID interno"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      Identificador fixo usado pelo sistema em integrações,
                      webhooks, contratos e relatórios. Definido na criação e
                      <strong> nunca pode ser alterado</strong> — mudá-lo
                      quebraria pedidos antigos e integrações.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={draft.plan_key}
                  onChange={(e) => onChange({ plan_key: slugify(e.target.value) })}
                  placeholder="motorista-premium"
                  disabled={!!draft.id}
                />
                <p className="text-xs text-muted-foreground">
                  {draft.id
                    ? "Bloqueado após criação — usado em integrações."
                    : "Gerado automaticamente do nome. Edite só se precisar."}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs">Endereço público da página</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="O que é o endereço público"
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      Pedaço final da URL que o cliente vê na barra de
                      endereços. <strong>Pode ser alterado a qualquer momento</strong> —
                      útil para SEO ou rebrand sem afetar integrações.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={draft.slug}
                  onChange={(e) => onChange({ slug: slugify(e.target.value) })}
                  placeholder="motorista-premium"
                />
                <p className="text-xs text-muted-foreground">
                  URL: /p/produto/{draft.slug || "..."}
                </p>
              </div>
            </div>
          </TooltipProvider>
        )}
        {!modoAvancado && (draft.plan_key || draft.slug) && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            URL pública: <span className="font-mono">/p/produto/{draft.slug || "..."}</span>
          </div>
        )}
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
              onFocus={() => setMensalFocado(true)}
              onBlur={() => {
                setMensalFocado(false);
                const cents = parseToCents(precoMensalStr);
                onChange({ price_cents: cents });
                if (precoMensalStr.trim() !== "") {
                  setPrecoMensalStr(centsToStr(cents));
                }
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
              onFocus={() => setAnualFocado(true)}
              onBlur={() => {
                setAnualFocado(false);
                if (precoAnualStr.trim() === "") {
                  onChange({ price_yearly_cents: null });
                  return;
                }
                const cents = parseToCents(precoAnualStr);
                onChange({ price_yearly_cents: cents });
                setPrecoAnualStr(centsToStr(cents));
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
