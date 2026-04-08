import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Plus } from "lucide-react";
import { AVAILABLE_VARS } from "../hooks/hook_message_flows";
import { CATEGORY_LABELS } from "../constants/constantes_mensagens";
import type { MessageTemplate } from "../hooks/hook_message_templates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: MessageTemplate | null;
  brandId: string;
  onSave: (data: Partial<MessageTemplate> & { brand_id: string }) => Promise<void>;
  isSaving: boolean;
}

export function EditorTemplateMensagem({ open, onOpenChange, template, brandId, onSave, isSaving }: Props) {
  const [name, setName] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [category, setCategory] = useState("general");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setBodyTemplate(template.body_template);
      setCategory(template.category);
    } else {
      setName("");
      setBodyTemplate("");
      setCategory("general");
    }
  }, [template, open]);

  const inserirVariavel = (varKey: string) => {
    const tag = `{{${varKey}}}`;
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = bodyTemplate.substring(0, start) + tag + bodyTemplate.substring(end);
      setBodyTemplate(newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      setBodyTemplate((prev) => prev + tag);
    }
  };

  const previewMessage = () => {
    let msg = bodyTemplate;
    for (const v of AVAILABLE_VARS) {
      msg = msg.split(`{{${v.key}}}`).join(v.example);
    }
    return msg;
  };

  const usedVars = AVAILABLE_VARS.filter((v) => bodyTemplate.includes(`{{${v.key}}}`)).map((v) => v.key);

  const handleSave = async () => {
    if (!name.trim() || !bodyTemplate.trim()) return;
    await onSave({
      ...(template?.id ? { id: template.id } : {}),
      brand_id: brandId,
      name: name.trim(),
      body_template: bodyTemplate,
      available_vars: usedVars,
      category,
      is_active: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do template</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Desafio recebido" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Variáveis disponíveis</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARS.map((v) => (
                <Badge
                  key={v.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => inserirVariavel(v.key)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {`{{${v.key}}}`}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Corpo da mensagem</Label>
            <Textarea
              ref={textareaRef}
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              placeholder="Olá {{nome}}, você foi desafiado para um duelo!"
              rows={5}
              className="font-mono text-sm"
            />
          </div>

          {bodyTemplate && (
            <Card className="border-dashed">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{previewMessage()}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim() || !bodyTemplate.trim()}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
