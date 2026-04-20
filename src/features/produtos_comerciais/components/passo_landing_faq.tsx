import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import type { ProdutoComercialDraft, LandingFaqItem } from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

const MAX_FAQ = 8;

export default function PassoLandingFaq({ draft, onChange }: Props) {
  const lc = draft.landing_config_json;
  const faq = lc.faq ?? [];

  const updateFaq = (next: LandingFaqItem[]) =>
    onChange({ landing_config_json: { ...lc, faq: next } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> Perguntas frequentes
          </h3>
          <p className="text-xs text-muted-foreground">
            Até {MAX_FAQ} pares pergunta/resposta — aparecem em accordion na landing.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={faq.length >= MAX_FAQ}
          onClick={() => updateFaq([...faq, { question: "", answer: "" }])}
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar
        </Button>
      </div>

      {faq.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhuma pergunta cadastrada.</p>
      ) : (
        <div className="space-y-3">
          {faq.map((f, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Pergunta *</Label>
                  <Input
                    value={f.question}
                    onChange={(e) => {
                      const next = [...faq];
                      next[i] = { ...f, question: e.target.value };
                      updateFaq(next);
                    }}
                    placeholder="Posso cancelar a qualquer momento?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resposta *</Label>
                  <Textarea
                    rows={3}
                    value={f.answer}
                    onChange={(e) => {
                      const next = [...faq];
                      next[i] = { ...f, answer: e.target.value };
                      updateFaq(next);
                    }}
                    placeholder="Sim, sem multa. Basta entrar em contato com nosso suporte."
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => updateFaq(faq.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remover
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
