import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import PreviewLanding from "./preview_landing";
import type { ProdutoComercialDraft } from "../types/tipos_produto";
import {
  montarLinkLanding,
  montarLinkTrial,
} from "../utils/utilitarios_link_publico";

interface Props {
  draft: ProdutoComercialDraft;
  saved: boolean;
}

export default function PassoRevisao({ draft, saved }: Props) {
  const landingUrl = montarLinkLanding(draft.slug);
  const trialUrl = montarLinkTrial(draft.slug);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Resumo</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">Produto:</strong> {draft.product_name}
              </li>
              <li>
                <strong className="text-foreground">Plano:</strong> {draft.label} ({draft.plan_key})
              </li>
              <li>
                <strong className="text-foreground">Preço:</strong> R$ {(draft.price_cents / 100).toFixed(2)}/mês
                {draft.price_yearly_cents != null &&
                  ` · R$ ${(draft.price_yearly_cents / 100).toFixed(2)}/ano`}
              </li>
              <li>
                <strong className="text-foreground">Trial:</strong> {draft.trial_days} dias
              </li>
              <li>
                <strong className="text-foreground">Modelos:</strong> {draft.business_model_ids.length}
              </li>
              <li>
                <strong className="text-foreground">Funcionalidades:</strong> {draft.module_definition_ids.length}
              </li>
              <li>
                <strong className="text-foreground">Status:</strong>{" "}
                {draft.is_active ? "Ativo" : "Inativo"}
                {draft.is_public_listed ? " · listado em /produtos" : ""}
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Links de divulgação</h4>
            {!saved && (
              <p className="text-xs text-muted-foreground rounded-md bg-muted/40 border p-2">
                Salve o produto para ativar os links abaixo.
              </p>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Landing page do produto</Label>
              <div className="flex gap-1">
                <Input value={landingUrl} readOnly className="text-xs" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copy(landingUrl, "Link da landing")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => window.open(landingUrl, "_blank")}
                  disabled={!saved}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Link direto de trial</Label>
              <div className="flex gap-1">
                <Input value={trialUrl} readOnly className="text-xs" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copy(trialUrl, "Link de trial")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => window.open(trialUrl, "_blank")}
                  disabled={!saved}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {copied && <p className="text-xs text-primary">{copied} ✓</p>}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Preview da landing</h4>
          <PreviewLanding draft={draft} />
        </div>
      </div>
    </div>
  );
}
