import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useMessageTemplates, type MessageTemplate } from "../hooks/hook_message_templates";
import { EditorTemplateMensagem } from "./editor_template_mensagem";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../constants/constantes_mensagens";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  brandId: string;
}

export function ListaTemplatesMensagem({ brandId }: Props) {
  const { templates, isLoading, upsertTemplate, deleteTemplate, isSaving } = useMessageTemplates(brandId);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const handleEdit = (t: MessageTemplate) => {
    setEditingTemplate(t);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleToggle = async (t: MessageTemplate) => {
    await upsertTemplate({ id: t.id, brand_id: brandId, is_active: !t.is_active });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Templates de Mensagem</h3>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Novo Template
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum template criado ainda</p>
            <Button onClick={handleNew} variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-1.5" /> Criar primeiro template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((t) => (
            <Card key={t.id} className={!t.is_active ? "opacity-50" : ""}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{t.name}</CardTitle>
                    <Badge variant="secondary" className={`text-xs ${CATEGORY_COLORS[t.category] ?? ""}`}>
                      {CATEGORY_LABELS[t.category] ?? t.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={t.is_active} onCheckedChange={() => handleToggle(t)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Fluxos vinculados a este template também serão removidos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTemplate(t.id)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-xs text-muted-foreground font-mono line-clamp-2">{t.body_template}</p>
                {t.available_vars.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.available_vars.map((v) => (
                      <Badge key={v} variant="outline" className="text-[10px]">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EditorTemplateMensagem
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        brandId={brandId}
        onSave={upsertTemplate}
        isSaving={isSaving}
      />
    </div>
  );
}
