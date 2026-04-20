import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import {
  EMPTY_DRAFT,
  type ProdutoComercialDraft,
} from "../types/tipos_produto";
import {
  useProdutoComercial,
  useSalvarProdutoComercial,
} from "../hooks/hook_produtos_comerciais";
import PassoIdentificacao from "./passo_identificacao";
import PassoModelos from "./passo_modelos";
import PassoModulos from "./passo_modulos";
import PassoLanding from "./passo_landing";
import PassoRevisao from "./passo_revisao";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planKey?: string; // se passado, edita
  initialDraft?: ProdutoComercialDraft; // pré-preenche (template) no modo criação
}

const STEPS = [
  { key: "ident", label: "Identificação" },
  { key: "models", label: "Modelos" },
  { key: "modules", label: "Funcionalidades" },
  { key: "landing", label: "Landing" },
  { key: "review", label: "Revisão" },
] as const;

export default function WizardProduto({ open, onOpenChange, planKey, initialDraft }: Props) {
  const isEdit = !!planKey;
  const { data: existing, isLoading } = useProdutoComercial(planKey);
  const salvar = useSalvarProdutoComercial();

  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState<ProdutoComercialDraft>(EMPTY_DRAFT);
  const [savedOnce, setSavedOnce] = useState(false);

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setSavedOnce(isEdit);
      setDraft(existing ?? initialDraft ?? EMPTY_DRAFT);
    }
  }, [open, existing, isEdit, initialDraft]);

  const update = (patch: Partial<ProdutoComercialDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const validateCurrent = (): string | null => {
    if (stepIdx === 0) {
      if (!draft.product_name.trim()) return "Informe o nome comercial do produto.";
      if (!draft.label.trim()) return "Informe o nome interno do plano.";
      if (!draft.plan_key.trim()) return "Informe a chave técnica.";
      if (!draft.slug.trim()) return "Informe o slug da landing.";
      if (draft.price_cents <= 0) return "Informe um preço válido.";
    }
    if (stepIdx === 1 && draft.business_model_ids.length === 0) {
      return "Selecione ao menos 1 modelo de negócio.";
    }
    return null;
  };

  const next = () => {
    const err = validateCurrent();
    if (err) {
      toast.error(err);
      return;
    }
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  };

  const back = () => stepIdx > 0 && setStepIdx(stepIdx - 1);

  const handleSave = async () => {
    const err = validateCurrent();
    if (err) {
      toast.error(err);
      return;
    }
    try {
      await salvar.mutateAsync(draft);
      setSavedOnce(true);
      if (stepIdx < STEPS.length - 1) setStepIdx(STEPS.length - 1);
    } catch {
      // toast já tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Editar Produto Comercial"
              : initialDraft
              ? "Criar a partir do Template"
              : "Criar Produto Comercial"}
          </DialogTitle>
        </DialogHeader>

        {!isEdit && initialDraft && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
            <p className="font-semibold text-primary mb-0.5">
              ✨ Template carregado: {initialDraft.product_name}
            </p>
            <p>
              Os campos foram pré-preenchidos como exemplo. Ajuste{" "}
              <strong>chave técnica</strong> e <strong>slug</strong> antes de
              salvar e selecione manualmente os <strong>modelos de negócio</strong>{" "}
              (passo 2) e <strong>módulos</strong> (passo 3).
            </p>
          </div>
        )}

        {/* Stepper */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const active = i === stepIdx;
            const done = i < stepIdx;
            return (
              <button
                key={s.key}
                onClick={() => setStepIdx(i)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    active
                      ? "bg-primary-foreground text-primary"
                      : done
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  {i + 1}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-[300px] py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {stepIdx === 0 && <PassoIdentificacao draft={draft} onChange={update} />}
              {stepIdx === 1 && <PassoModelos draft={draft} onChange={update} />}
              {stepIdx === 2 && <PassoModulos draft={draft} onChange={update} />}
              {stepIdx === 3 && <PassoLanding draft={draft} onChange={update} />}
              {stepIdx === 4 && <PassoRevisao draft={draft} saved={savedOnce} />}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={back}
            disabled={stepIdx === 0 || salvar.isPending}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>

          <div className="flex gap-2">
            {stepIdx === STEPS.length - 1 ? (
              <Button onClick={handleSave} disabled={salvar.isPending} className="gap-1">
                {salvar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savedOnce ? "Atualizar produto" : "Salvar produto"}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleSave} disabled={salvar.isPending}>
                  {salvar.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Salvar rascunho
                </Button>
                <Button onClick={next} className="gap-1">
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
