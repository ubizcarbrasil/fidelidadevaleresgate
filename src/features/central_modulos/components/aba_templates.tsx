import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, PlayCircle, Bookmark } from "lucide-react";
import {
  useModuleTemplates, useDeletarModuleTemplate,
  type ModuleTemplateWithItems,
} from "../hooks/hook_module_templates";
import DialogEditorTemplate from "./dialog_editor_template";
import DialogAplicarTemplate from "./dialog_aplicar_template";

export default function AbaTemplates() {
  const { data: templates, isLoading } = useModuleTemplates();
  const deletar = useDeletarModuleTemplate();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleTemplateWithItems | null>(null);
  const [aplicarOpen, setAplicarOpen] = useState(false);
  const [aplicarTpl, setAplicarTpl] = useState<ModuleTemplateWithItems | null>(null);
  const [excluirTpl, setExcluirTpl] = useState<ModuleTemplateWithItems | null>(null);

  const abrirCriar = () => { setEditing(null); setEditorOpen(true); };
  const abrirEditar = (t: ModuleTemplateWithItems) => { setEditing(t); setEditorOpen(true); };
  const abrirAplicar = (t: ModuleTemplateWithItems) => { setAplicarTpl(t); setAplicarOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Crie conjuntos reutilizáveis de módulos e aplique em lote a marcas e/ou cidades.
          </p>
        </div>
        <Button onClick={abrirCriar} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (templates?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Bookmark className="h-10 w-10 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">Nenhum template criado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Comece criando um conjunto de módulos para reaproveitar nas próximas marcas/cidades.
              </p>
            </div>
            <Button onClick={abrirCriar} variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" /> Criar primeiro template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates!.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <div className="h-1.5" style={{ background: t.color }} />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{t.name}</h3>
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {t.items.length} módulo(s)
                  </Badge>
                </div>

                <div className="flex gap-1.5">
                  <Button
                    size="sm" className="flex-1 gap-1"
                    onClick={() => abrirAplicar(t)}
                    disabled={t.items.length === 0}
                  >
                    <PlayCircle className="h-3.5 w-3.5" /> Aplicar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => abrirEditar(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setExcluirTpl(t)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DialogEditorTemplate
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editing}
      />
      <DialogAplicarTemplate
        open={aplicarOpen}
        onOpenChange={setAplicarOpen}
        template={aplicarTpl}
      />

      <AlertDialog open={!!excluirTpl} onOpenChange={(o) => !o && setExcluirTpl(null)}>
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              O template <strong>{excluirTpl?.name}</strong> será removido permanentemente.
              As marcas e cidades em que ele já foi aplicado <strong>não</strong> serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (excluirTpl) await deletar.mutateAsync(excluirTpl.id);
                setExcluirTpl(null);
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