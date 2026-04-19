/**
 * CardPricingPlano — Sub-fase 5.4
 * Card por plano: preço por ponto + opções avançadas (margens) + salvar.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Save, Eraser } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PLANS, type PlanKey } from "../constants/constantes_planos";
import {
  useUpdateGanhaGanhaPricing,
  type GanhaGanhaPricingRow,
} from "@/compartilhados/hooks/hook_ganha_ganha_pricing";

interface Props {
  planKey: PlanKey;
  current: GanhaGanhaPricingRow | undefined;
}

function centsToReais(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function reaisToCents(input: string): number | null {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

export default function CardPricingPlano({ planKey, current }: Props) {
  const def = PLANS.find((p) => p.key === planKey)!;
  const Icon = def.icon;
  const update = useUpdateGanhaGanhaPricing();

  const initialPrice = current ? centsToReais(current.price_per_point_cents) : "0,10";
  const initialMin = current?.min_margin_pct != null ? String(current.min_margin_pct) : "";
  const initialMax = current?.max_margin_pct != null ? String(current.max_margin_pct) : "";

  const [priceStr, setPriceStr] = useState(initialPrice);
  const [minStr, setMinStr] = useState(initialMin);
  const [maxStr, setMaxStr] = useState(initialMax);
  const [openAdv, setOpenAdv] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setPriceStr(initialPrice);
    setMinStr(initialMin);
    setMaxStr(initialMax);
  }, [initialPrice, initialMin, initialMax]);

  const validation = useMemo(() => {
    const cents = reaisToCents(priceStr);
    if (cents === null || cents < 1 || cents > 1000) {
      return { ok: false, msg: "Preço deve estar entre R$ 0,01 e R$ 10,00" };
    }
    const minNum = minStr.trim() === "" ? null : Number(minStr.replace(",", "."));
    const maxNum = maxStr.trim() === "" ? null : Number(maxStr.replace(",", "."));
    if (minNum !== null && (!Number.isFinite(minNum) || minNum < 0 || minNum > 500)) {
      return { ok: false, msg: "Margem mínima deve estar entre 0 e 500" };
    }
    if (maxNum !== null && (!Number.isFinite(maxNum) || maxNum < 0 || maxNum > 500)) {
      return { ok: false, msg: "Margem máxima deve estar entre 0 e 500" };
    }
    if (minNum !== null && maxNum !== null && maxNum <= minNum) {
      return { ok: false, msg: "Máxima deve ser maior que mínima" };
    }
    return { ok: true, cents, minNum, maxNum };
  }, [priceStr, minStr, maxStr]);

  const isDirty = useMemo(() => {
    return priceStr !== initialPrice || minStr !== initialMin || maxStr !== initialMax;
  }, [priceStr, minStr, maxStr, initialPrice, initialMin, initialMax]);

  const priceChangedSignificantly = useMemo(() => {
    if (!current || !validation.ok || validation.cents === undefined) return false;
    const oldCents = current.price_per_point_cents;
    if (oldCents === 0) return false;
    return Math.abs(validation.cents - oldCents) / oldCents > 0.5;
  }, [current, validation]);

  function detectAction(): "price_updated" | "margin_limits_updated" | "margin_limits_cleared" {
    if (!validation.ok) return "price_updated";
    const priceSame = current && validation.cents === current.price_per_point_cents;
    const marginsCleared =
      current &&
      (current.min_margin_pct !== null || current.max_margin_pct !== null) &&
      validation.minNum === null &&
      validation.maxNum === null;
    if (priceSame && marginsCleared) return "margin_limits_cleared";
    if (priceSame) return "margin_limits_updated";
    return "price_updated";
  }

  async function doSave() {
    if (!validation.ok || validation.cents === undefined) return;
    await update.mutateAsync({
      plan_key: planKey,
      price_per_point_cents: validation.cents,
      min_margin_pct: validation.minNum ?? null,
      max_margin_pct: validation.maxNum ?? null,
      previous: current
        ? {
            price_per_point_cents: current.price_per_point_cents,
            min_margin_pct: current.min_margin_pct,
            max_margin_pct: current.max_margin_pct,
          }
        : undefined,
      action: detectAction(),
    });
  }

  function handleSaveClick() {
    if (priceChangedSignificantly) {
      setConfirmOpen(true);
      return;
    }
    doSave();
  }

  function handleClearLimits() {
    setMinStr("");
    setMaxStr("");
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: `hsl(var(--primary))` }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${def.colorClass}`} />
          <div className="font-semibold text-sm">{def.label}</div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`price-${planKey}`} className="text-xs">
            R$ por ponto emitido
          </Label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">R$</span>
            <Input
              id={`price-${planKey}`}
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              placeholder="0,10"
              className="font-mono"
              inputMode="decimal"
            />
          </div>
        </div>

        <Collapsible open={openAdv} onOpenChange={setOpenAdv}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 -mx-2">
              <span className="text-xs">Opções avançadas</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openAdv ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="space-y-1">
              <Label htmlFor={`min-${planKey}`} className="text-xs">
                Margem mínima (%)
              </Label>
              <Input
                id={`min-${planKey}`}
                value={minStr}
                onChange={(e) => setMinStr(e.target.value)}
                placeholder="—"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`max-${planKey}`} className="text-xs">
                Margem máxima (%)
              </Label>
              <Input
                id={`max-${planKey}`}
                value={maxStr}
                onChange={(e) => setMaxStr(e.target.value)}
                placeholder="—"
                inputMode="decimal"
              />
            </div>
            {(minStr || maxStr) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearLimits}
                className="w-full justify-center"
              >
                <Eraser className="h-3.5 w-3.5 mr-1.5" />
                Limpar limites
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {!validation.ok && (
          <p className="text-xs text-destructive">{validation.msg}</p>
        )}

        <Button
          onClick={handleSaveClick}
          disabled={!validation.ok || !isDirty || update.isPending}
          size="sm"
          className="w-full"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {update.isPending ? "Salvando..." : "Salvar"}
        </Button>

        {current && (
          <p className="text-[11px] text-muted-foreground text-center">
            Atualizado{" "}
            {formatDistanceToNow(new Date(current.valid_from), {
              locale: ptBR,
              addSuffix: true,
            })}
          </p>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Variação de preço acima de 50%</AlertDialogTitle>
            <AlertDialogDescription>
              O novo preço (R$ {priceStr}) é mais de 50% diferente do atual
              {current ? ` (R$ ${centsToReais(current.price_per_point_cents)})` : ""}. Deseja
              prosseguir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                doSave();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
