import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Star,
  Package,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  useProdutosComerciais,
  useExcluirProdutoComercial,
} from "./hooks/hook_produtos_comerciais";
import WizardProduto from "./components/wizard_produto";
import { ManualModal } from "@/compartilhados/components/manual_modal";
import { TEMPLATE_VALE_RESGATE_MOTORISTA_PREMIUM } from "./constants/constantes_template";
import type { ProdutoComercialDraft } from "./types/tipos_produto";
import {
  montarLinkLanding,
  montarLinkTrial,
} from "./utils/utilitarios_link_publico";

export default function PaginaProdutosComerciais() {
  const { data: produtos, isLoading } = useProdutosComerciais();
  const excluir = useExcluirProdutoComercial();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editKey, setEditKey] = useState<string | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<ProdutoComercialDraft | undefined>(undefined);

  const openCreate = () => {
    setEditKey(undefined);
    setTemplateDraft(undefined);
    setWizardOpen(true);
  };
  const openEdit = (planKey: string) => {
    setEditKey(planKey);
    setTemplateDraft(undefined);
    setWizardOpen(true);
  };
  const openFromTemplate = () => {
    setEditKey(undefined);
    setTemplateDraft(TEMPLATE_VALE_RESGATE_MOTORISTA_PREMIUM);
    setWizardOpen(true);
  };

  const copyTrial = (slug: string) => {
    navigator.clipboard.writeText(montarLinkTrial(slug));
    toast.success("Link de trial copiado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <PageHeader
          title="Produtos Comerciais"
          description="Monte produtos de prateleira com modelos, funcionalidades, preço e landing page para divulgação."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setManualOpen(true)}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Ver Manual</span>
          </Button>
          <Button
            variant="outline"
            onClick={openFromTemplate}
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Usar template</span>
            <span className="sm:hidden">Template</span>
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Criar produto</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (produtos ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Package className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nenhum produto criado ainda. Clique em "Criar produto" para montar seu primeiro bundle.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(produtos ?? []).map((p) => (
            <Card key={p.id} className={p.is_popular ? "border-primary/40" : ""}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base truncate">{p.product_name}</h3>
                      {p.is_popular && (
                        <Badge className="gap-1 text-[10px]">
                          <Star className="h-3 w-3" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.label} · <code className="text-[10px]">{p.plan_key}</code>
                    </p>
                  </div>
                  <Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px]">
                    {p.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div>
                  <p className="text-2xl font-extrabold">
                    R$ {(p.price_cents / 100).toFixed(2).replace(".", ",")}
                    <span className="text-xs text-muted-foreground font-normal">/mês</span>
                  </p>
                  {p.price_yearly_cents != null && (
                    <p className="text-xs text-muted-foreground">
                      ou R$ {(p.price_yearly_cents / 100).toFixed(2).replace(".", ",")}/ano
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {p.is_public_listed && (
                    <Badge variant="outline" className="text-[10px]">
                      Listado público
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    Trial {p.trial_days}d
                  </Badge>
                </div>

                <div className="flex items-center gap-1 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => openEdit(p.plan_key)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    title="Copiar link de trial"
                    onClick={() => copyTrial(p.slug)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    title="Abrir landing"
                    onClick={() => window.open(montarLinkLanding(p.slug), "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    title="Excluir produto"
                    onClick={() => setConfirmDelete(p.plan_key)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WizardProduto
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        planKey={editKey}
        initialDraft={templateDraft}
      />

      <ManualModal
        open={manualOpen}
        onOpenChange={setManualOpen}
        manualIds={[
          "produtos-comerciais-bundles-vendaveis",
          "produtos-comerciais-exemplo-pratico",
        ]}
        titulo="Manuais — Produtos Comerciais"
        descricao="Aprenda a montar bundles vendáveis e veja um exemplo prático completo."
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto comercial?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o plano <strong>{confirmDelete}</strong>, sua landing e
              todas as ligações com modelos e funcionalidades. Marcas que já contrataram
              este plano vão precisar ser realocadas em outro plano.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  excluir.mutate(confirmDelete);
                  setConfirmDelete(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
