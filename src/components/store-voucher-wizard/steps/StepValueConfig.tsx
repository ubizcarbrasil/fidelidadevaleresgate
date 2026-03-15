import { StoreVoucherData, ScaledValue } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

export default function StepValueConfig({ data, update }: Props) {
  const isPercent = data.discount_mode === "PERCENT";
  const isProduct = data.coupon_type === "PRODUCT";
  const isEarnOnly = data.offer_purpose === "EARN";

  // For EARN-only offers, no discount config needed
  if (isEarnOnly) {
    return (
      <div className="space-y-5">
        <Label className="text-base font-semibold">Configuração de Valor</Label>
        {isProduct && (
          <div className="p-3 border rounded-lg bg-accent/30">
            <Label className="font-semibold">Valor do produto (R$)</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-lg font-bold text-muted-foreground">R$</span>
              <Input
                type="number" min={0.01} step={0.01}
                value={data.product_price}
                onChange={(e) => update({ product_price: Number(e.target.value) })}
                className="text-lg font-bold max-w-[140px]"
                placeholder="0,00"
              />
            </div>
          </div>
        )}
        {!isProduct && (
          <div className="space-y-1">
            <Label>Compra mínima</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input
                type="number" min={0} step={0.01}
                value={data.min_purchase}
                onChange={(e) => update({ min_purchase: Number(e.target.value) })}
              />
            </div>
          </div>
        )}
        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm border border-green-200 dark:border-green-900">
          <strong className="text-green-700 dark:text-green-300">Ganhe Pontos</strong>
          <p className="text-xs text-muted-foreground mt-1">
            O cliente acumula pontos pelo valor pago. Nenhuma configuração de desconto/resgate é necessária.
          </p>
        </div>
      </div>
    );
  }

  const creditValue = isProduct
    ? isPercent
      ? (data.discount_percent / 100) * data.product_price
      : data.discount_fixed
    : isPercent
      ? (data.discount_percent / 100) * data.min_purchase
      : data.discount_fixed;

  const addScale = () => {
    if (data.scaled_values.length >= 5) return;
    const lastMin = data.scaled_values.length > 0
      ? data.scaled_values[data.scaled_values.length - 1].min_purchase
      : data.min_purchase;
    const newMin = lastMin + 100;
    const newCredit = isPercent ? (data.discount_percent / 100) * newMin : data.discount_fixed;
    update({
      scaled_values: [...data.scaled_values, { min_purchase: newMin, credit_value: newCredit }],
    });
  };

  const removeScale = (idx: number) => {
    update({ scaled_values: data.scaled_values.filter((_, i) => i !== idx) });
  };

  const updateScale = (idx: number, field: keyof ScaledValue, value: number) => {
    const updated = data.scaled_values.map((s, i) => {
      if (i !== idx) return s;
      const newS = { ...s, [field]: value };
      if (field === "min_purchase" && isPercent) {
        newS.credit_value = (data.discount_percent / 100) * value;
      }
      return newS;
    });
    update({ scaled_values: updated });
  };

  return (
    <div className="space-y-5">
      <Label className="text-base font-semibold">Configuração de Valor</Label>

      {/* Product price field - only for PRODUCT type */}
      {isProduct && (
        <div className="space-y-1 p-3 border rounded-lg bg-accent/30">
          <Label className="font-semibold">Valor do produto (R$)</Label>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-muted-foreground">R$</span>
            <Input
              type="number" min={0.01} step={0.01}
              value={data.product_price}
              onChange={(e) => update({ product_price: Number(e.target.value) })}
              className="text-lg font-bold max-w-[140px]"
              placeholder="0,00"
            />
          </div>
          <p className="text-xs text-muted-foreground">Informe o preço original do produto para calcular o desconto em pontos.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => update({ discount_mode: "PERCENT" })}
          className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
            isPercent ? "border-primary bg-primary/10 text-primary" : "border-border"
          }`}
        >
          Percentual (%)
        </button>
        <button
          type="button"
          onClick={() => update({ discount_mode: "FIXED" })}
          className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
            !isPercent ? "border-primary bg-primary/10 text-primary" : "border-border"
          }`}
        >
          Valor Fixo (R$)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isPercent ? (
          <div className="space-y-1">
            <Label>Percentual pago com pontos</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number" min={1} max={100} step={1}
                value={data.discount_percent}
                onChange={(e) => update({ discount_percent: Number(e.target.value) })}
                className="text-lg font-bold max-w-[100px]"
              />
              <span className="text-lg font-bold text-muted-foreground">%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <Label>Valor pago com pontos</Label>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-muted-foreground">R$</span>
              <Input
                type="number" min={0.01} step={0.01}
                value={data.discount_fixed}
                onChange={(e) => update({ discount_fixed: Number(e.target.value) })}
                className="text-lg font-bold max-w-[120px]"
              />
            </div>
          </div>
        )}
        {!isProduct && (
          <div className="space-y-1">
            <Label>Compra mínima</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input
                type="number" min={0} step={0.01}
                value={data.min_purchase}
                onChange={(e) => update({ min_purchase: Number(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-3 bg-accent/50 rounded-lg text-sm">
        {isProduct ? (
          <>
            <strong>Você pode pagar {isPercent ? `${data.discount_percent}%` : `R$ ${data.discount_fixed.toFixed(2)}`} com pontos</strong>
            <br />
            <span className="text-muted-foreground">
              {Math.floor(creditValue)} pontos por R$ {creditValue.toFixed(2)} | Produto: R$ {data.product_price.toFixed(2)}
            </span>
            {data.offer_purpose === "BOTH" && (
              <>
                <br />
                <span className="text-muted-foreground">
                  Ao pagar R$ {(data.product_price - creditValue).toFixed(2)} em dinheiro, o cliente acumula {Math.floor(data.product_price - creditValue)} pontos
                </span>
              </>
            )}
          </>
        ) : (
          <>
            <strong>CRÉDITO DE R$ {creditValue.toFixed(2)}</strong>
            <br />
            <span className="text-muted-foreground">
              {Math.floor(creditValue)} pontos por R$ {creditValue.toFixed(2)} na compra mínima de R$ {data.min_purchase.toFixed(2)}
            </span>
          </>
        )}
      </div>

      {isPercent && !isProduct && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Faixas escalonadas (até 5)</Label>
            {data.scaled_values.length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={addScale}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar faixa
              </Button>
            )}
          </div>
          {data.scaled_values.map((sv, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg">
              <span className="text-sm font-medium whitespace-nowrap">{data.discount_percent}%</span>
              <span className="text-sm text-muted-foreground">=</span>
              <span className="text-sm font-bold text-primary">R$ {sv.credit_value.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">para</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">R$</span>
                <Input
                  type="number" min={0} step={1}
                  value={sv.min_purchase}
                  onChange={(e) => updateScale(idx, "min_purchase", Number(e.target.value))}
                  className="w-24 h-8 text-sm"
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeScale(idx)} className="h-8 w-8">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
