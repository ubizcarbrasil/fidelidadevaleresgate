import { Check, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProdutoComercialDraft } from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
}

export default function PreviewLanding({ draft }: Props) {
  const lc = draft.landing_config_json;
  const color = lc.primary_color || "#6366f1";

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Hero */}
      <div
        className="p-6 sm:p-8 text-center space-y-3"
        style={{ background: `linear-gradient(135deg, ${color}22, transparent)` }}
      >
        {draft.is_popular && (
          <Badge className="mx-auto" style={{ backgroundColor: color }}>
            Mais popular
          </Badge>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold">
          {lc.headline || draft.product_name || "Headline do produto"}
        </h1>
        {lc.subheadline && (
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">{lc.subheadline}</p>
        )}
        {lc.hero_image_url && (
          <img
            src={lc.hero_image_url}
            alt="Hero"
            className="mx-auto max-h-40 object-contain rounded-lg"
          />
        )}
      </div>

      {/* Pricing */}
      <div className="p-6 border-t bg-card text-center space-y-2">
        <div className="text-4xl font-extrabold" style={{ color }}>
          R$ {(draft.price_cents / 100).toFixed(2).replace(".", ",")}
          <span className="text-sm font-normal text-muted-foreground">/mês</span>
        </div>
        {draft.price_yearly_cents != null && (
          <p className="text-xs text-muted-foreground">
            ou R$ {(draft.price_yearly_cents / 100).toFixed(2).replace(".", ",")} no plano anual
          </p>
        )}
        <Button
          size="lg"
          className="mt-2 gap-2"
          style={{ backgroundColor: color, color: "#fff" }}
        >
          <Rocket className="h-4 w-4" />
          {lc.cta_label || `Começar trial ${draft.trial_days} dias grátis`}
        </Button>
      </div>

      {/* Benefits */}
      {(lc.benefits ?? []).length > 0 && (
        <div className="p-6 border-t space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">O que está incluso</p>
          <ul className="space-y-1.5">
            {(lc.benefits ?? []).map((b, i) => {
              const txt = typeof b === "string" ? b : b.title;
              return (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color }} />
                  <span>{txt}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
