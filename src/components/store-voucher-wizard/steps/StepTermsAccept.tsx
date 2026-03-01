import { StoreVoucherData, WEEKDAY_LABELS } from "../types";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

function generateTerms(data: StoreVoucherData): string {
  const isPercent = data.discount_mode === "PERCENT";
  const creditBase = isPercent
    ? (data.discount_percent / 100) * data.min_purchase
    : data.discount_fixed;

  let text = `TERMOS E CONDIÇÕES DE USO DO CUPOM\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 VALOR DO DESCONTO\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (isPercent && data.scaled_values.length > 0) {
    text += `Desconto de ${data.discount_percent}% disponível em ${data.scaled_values.length + 1} opções:\n\n`;
    text += `• Cupom 1: ${data.discount_percent}% vale R$${creditBase.toFixed(2)} em crédito\n`;
    text += `  Na compra mínima de R$${data.min_purchase.toFixed(2)}\n\n`;
    data.scaled_values.forEach((sv, i) => {
      text += `• Cupom ${i + 2}: ${data.discount_percent}% vale R$${sv.credit_value.toFixed(2)} em crédito\n`;
      text += `  Na compra mínima de R$${sv.min_purchase.toFixed(2)}\n\n`;
    });
  } else {
    text += isPercent
      ? `Desconto de ${data.discount_percent}% — vale R$${creditBase.toFixed(2)} em crédito\nNa compra mínima de R$${data.min_purchase.toFixed(2)}\n\n`
      : `Desconto fixo de R$${data.discount_fixed.toFixed(2)} em crédito\nNa compra mínima de R$${data.min_purchase.toFixed(2)}\n\n`;
  }

  text += `✓ Valor Fixo: O cliente sempre receberá o valor calculado, independente do valor da compra.\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 REGRAS E RESTRIÇÕES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `• Compra mínima: R$ ${data.min_purchase.toFixed(2)}\n`;
  text += `• Quantidade disponível: ${data.unlimited_total ? "Ilimitada" : data.max_total_uses}\n`;
  text += `• Uso máximo por cliente: ${data.unlimited_per_customer ? "Ilimitado" : data.max_uses_per_customer}\n`;

  if (data.requires_scheduling) {
    text += `• ⚠️ REQUER AGENDAMENTO PRÉVIO\n  Antecedência de ${data.scheduling_advance_hours} hs\n`;
  }
  if (!data.is_cumulative) {
    text += `• ⚠️ Oferta não acumulativa com outras promoções\n`;
  }
  if (data.has_specific_days && data.specific_days.length > 0) {
    text += `\n• Válido apenas em:\n`;
    data.specific_days.forEach((d) => {
      text += `  - ${WEEKDAY_LABELS[d.weekday]}: ${d.start_time} às ${d.end_time}\n`;
    });
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nℹ️  INFORMAÇÕES DO CUPOM\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `• Aplicação: ${data.coupon_type === "STORE" ? "Todo Estabelecimento" : "Produto Específico"}\n`;
  text += `• Tipo de desconto: ${isPercent ? "Percentual (%)" : "Valor Fixo (R$)"}\n`;
  if (data.validity_start) text += `• Data de liberação: ${new Date(data.validity_start).toLocaleDateString("pt-BR")}\n`;
  if (data.validity_end) text += `• Data de expiração: ${new Date(data.validity_end).toLocaleDateString("pt-BR")}\n`;

  return text;
}

export { generateTerms };

export default function StepTermsAccept({ data, update }: Props) {
  const terms = generateTerms(data);

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Termo de Aceite do Parceiro</Label>
      <p className="text-sm text-muted-foreground">Revise os termos gerados automaticamente com base nas configurações do cupom.</p>

      <div className="p-4 bg-muted/50 rounded-lg border max-h-[350px] overflow-y-auto">
        <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">{terms}</pre>
      </div>

      <div className="flex items-start gap-3 p-4 border rounded-lg">
        <Checkbox
          checked={data.terms_accepted}
          onCheckedChange={(v) => update({ terms_accepted: !!v })}
          className="mt-0.5"
        />
        <div>
          <p className="font-medium text-sm">Aceito os termos e condições</p>
          <p className="text-xs text-muted-foreground">Declaro que li e concordo com os termos acima para a publicação deste cupom.</p>
        </div>
      </div>
    </div>
  );
}
