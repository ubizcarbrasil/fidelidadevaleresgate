import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Zap, GitBranch } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMessageFlows, EVENT_TYPES, AUDIENCE_OPTIONS, type MessageFlow } from "../hooks/hook_message_flows";
import { useMessageTemplates } from "../hooks/hook_message_templates";
import type { Branch } from "../hooks/hook_integracoes";
import { CATEGORY_LABELS } from "../constants/constantes_mensagens";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  brandId: string;
  branches: Branch[];
}

export function ListaFluxosMensagem({ brandId, branches }: Props) {
  const { flows, isLoading, upsertFlow, deleteFlow, isSaving } = useMessageFlows(brandId);
  const { templates } = useMessageTemplates(brandId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<MessageFlow | null>(null);

  // Form state
  const [eventType, setEventType] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [audience, setAudience] = useState("all_drivers");
  const [branchId, setBranchId] = useState<string>("all");

  const openNew = () => {
    setEditingFlow(null);
    setEventType("");
    setTemplateId("");
    setAudience("all_drivers");
    setBranchId("all");
    setDialogOpen(true);
  };

  const openEdit = (f: MessageFlow) => {
    setEditingFlow(f);
    setEventType(f.event_type);
    setTemplateId(f.template_id);
    setAudience(f.audience);
    setBranchId(f.branch_id ?? "all");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!eventType || !templateId) return;
    await upsertFlow({
      ...(editingFlow?.id ? { id: editingFlow.id } : {}),
      brand_id: brandId,
      branch_id: branchId === "all" ? null : branchId,
      event_type: eventType,
      template_id: templateId,
      audience,
      is_active: true,
    });
    setDialogOpen(false);
  };

  const handleToggle = async (f: MessageFlow) => {
    await upsertFlow({ id: f.id, brand_id: brandId, is_active: !f.is_active });
  };

  const getTemplateName = (id: string) => templates.find((t) => t.id === id)?.name ?? "—";
  const getEventLabel = (val: string) => EVENT_TYPES.find((e) => e.value === val)?.label ?? val;
  const getAudienceLabel = (val: string) => AUDIENCE_OPTIONS.find((a) => a.value === val)?.label ?? val;
  const getBranchName = (id: string | null) => {
    if (!id) return "Todas as cidades";
    return branches.find((b) => b.id === id)?.name ?? id;
  };

  const activeTemplates = templates.filter((t) => t.is_active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fluxos Automáticos</h3>
        <Button onClick={openNew} size="sm" disabled={activeTemplates.length === 0}>
          <Plus className="h-4 w-4 mr-1.5" /> Novo Fluxo
        </Button>
      </div>

      {activeTemplates.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Crie pelo menos um template antes de configurar fluxos automáticos.
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : flows.length === 0 && activeTemplates.length > 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <GitBranch className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum fluxo configurado</p>
            <Button onClick={openNew} variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-1.5" /> Criar primeiro fluxo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {flows.map((f) => (
            <Card key={f.id} className={!f.is_active ? "opacity-50" : ""}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <CardTitle className="text-sm">{getEventLabel(f.event_type)}</CardTitle>
                    <Badge variant="outline" className="text-xs">{getAudienceLabel(f.audience)}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={f.is_active} onCheckedChange={() => handleToggle(f)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)}>
                      <Zap className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover fluxo?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteFlow(f.id)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Template: <strong className="text-foreground">{getTemplateName(f.template_id)}</strong></span>
                  <span>•</span>
                  <span>{getBranchName(f.branch_id)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFlow ? "Editar Fluxo" : "Novo Fluxo Automático"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Evento disparador</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue placeholder="Selecione o evento" /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template da mensagem</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
                <SelectContent>
                  {activeTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Audiência</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cidade (opcional)</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving || !eventType || !templateId}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
