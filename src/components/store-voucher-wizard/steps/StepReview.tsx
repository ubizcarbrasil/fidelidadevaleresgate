import { StoreVoucherData, WEEKDAY_LABELS } from "../types";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: StoreVoucherData;
}

export default function StepReview({ data }: Props) {
  const isPercent = data.discount_mode === "PERCENT";
  const isProduct = data.coupon_type === "PRODUCT";

  const creditBase = isProduct
    ? isPercent
      ? (data.discount_percent / 100) * data.product_price
      : data.discount_fixed
    : isPercent
      ? (data.discount_percent / 100) * data.min_purchase
      : data.discount_fixed;

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Revisão Final</Label>

      <div className="space-y-3 text-sm">
        {data.image_url && (
          <div className="rounded-xl overflow-hidden border border-border mb-3">
            <img src={data.image_url} alt="Imagem do cupom" className="w-full h-32 object-cover" />
          </div>
        )}
        {!data.image_url && data.coupon_type === "STORE" && (
          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground mb-3">
            📷 A logo da loja será usada automaticamente como imagem do cupom.
          </div>
        )}
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Categoria</span>
          <Badge variant="secondary">{data.coupon_category}</Badge>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Tipo</span>
          <span>{isProduct ? "Produto Específico" : "Loja Toda"}</span>
        </div>

        {/* Differentiated nomenclature */}
        <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
          {isProduct ? (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Nomenclatura do cupom</p>
              <p className="text-lg font-bold text-primary">
                PAGUE {isPercent ? `${data.discount_percent}%` : `R$ ${data.discount_fixed.toFixed(2)}`} COM PONTOS
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Produto: R$ {data.product_price.toFixed(2)} → {Math.floor(creditBase)} pts (= R$ {creditBase.toFixed(2)})
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Nomenclatura do cupom</p>
              <p className="text-lg font-bold text-primary">
                Troque {Math.floor(creditBase)} pts por R$ {creditBase.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sobre compra mínima de R$ {data.min_purchase.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Desconto</span>
          <span className="font-bold">
            {isPercent ? `${data.discount_percent}%` : `R$ ${data.discount_fixed.toFixed(2)}`}
          </span>
        </div>
        {isProduct && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Valor do produto</span>
            <span className="font-bold">R$ {data.product_price.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">{isProduct ? "Pontos necessários" : "Pontos de troca"}</span>
          <span>{Math.floor(creditBase)} pts{!isProduct && ` (mín. R$ ${data.min_purchase.toFixed(2)})`}</span>
        </div>
        {data.scaled_values.length > 0 && (
          <div className="border-b pb-2">
            <span className="text-muted-foreground">Faixas escalonadas:</span>
            {data.scaled_values.map((sv, i) => (
              <div key={i} className="ml-4 text-xs">
                {Math.floor(sv.credit_value)} pts para compra mín. R$ {sv.min_purchase.toFixed(2)}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Agendamento</span>
          <span>{data.requires_scheduling ? `Sim (${data.scheduling_advance_hours}h)` : "Não"}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Cumulativo</span>
          <span>{data.is_cumulative ? "Sim" : "Não"}</span>
        </div>
        {data.has_specific_days && data.specific_days.length > 0 && (
          <div className="border-b pb-2">
            <span className="text-muted-foreground">Dias específicos:</span>
            {data.specific_days.map((d, i) => (
              <div key={i} className="ml-4 text-xs">
                {WEEKDAY_LABELS[d.weekday]}: {d.start_time} — {d.end_time}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Validade</span>
          <span>
            {data.validity_start ? new Date(data.validity_start).toLocaleDateString("pt-BR") : "—"} até{" "}
            {data.validity_end ? new Date(data.validity_end).toLocaleDateString("pt-BR") : "—"}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Limites</span>
          <span>
            {data.unlimited_total ? "∞" : data.max_total_uses} total |{" "}
            {data.unlimited_per_customer ? "∞" : data.max_uses_per_customer}/cliente
          </span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Resgate</span>
          <span>{data.redemption_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Termos aceitos</span>
          <span>{data.terms_accepted ? "✅ Sim" : "❌ Não"}</span>
        </div>
      </div>
    </div>
  );
}
