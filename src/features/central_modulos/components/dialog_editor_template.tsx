import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Blocks, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CATEGORY_META, ORDEM_CATEGORIAS } from "@/compartilhados/constants/constantes_categorias_modulos";
import { useCatalogoModulos } from "../hooks/hook_catalogo";
import {
  useCriarModuleTemplate, useAtualizarModuleTemplate,
  type ModuleTemplateWithItems,
} from "../hooks/hook_module_templates";

function getIcon(name?: string): React.ComponentType<any> {
  if (!name) return Blocks;
  const Comp = (Icons as any)[name];
  return Comp ?? Blocks;
}

export default function DialogEditorTemplate({
  open, onOpenChange, template,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: ModuleTemplateWithItems | null; // null = criar
}) {
  const { data: modulos } = useCatalogoModulos();
  const criar = useCriarModuleTemplate();
  const atualizar = useAtualizarModuleTemplate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setDescription(template?.description ?? "");
      setColor(template?.color ?? "#3B82F6");
      setSelectedIds(new Set(template?.items.map((i) => i.module_definition_id) ?? []));
      setBusca("");
    }
  }, [open, template]);

  const grouped = useMemo(() => {
    const ativos = (modulos ?? []).filter((m) => m.is_active && !m.is_core);
    const filtered = busca
      ? ativos.filter((m) =>
          m.name.toLowerCase().includes(busca.toLowerCase()) ||
          m.key.toLowerCase().includes(busca.toLowerCase()),
        )
      : ativos;
    const map: Record<string, typeof ativos> = {};
    filtered.forEach((m) => {
      const cat = CATEGORY_META[m.category] ? m.category : "general";
      (map[cat] ||= []).push(m);
    });
    return map;
  }, [modulos, busca]);

  const sortedCats = ORDEM_CATEGORIAS.filter((c) => grouped[c]?.length);

  const toggleAll = (catKey: string, on: boolean) => {
    const ids = grouped[catKey]?.map((m) => m.id) ?? [];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const podeSalvar = name.trim().length >= 2 && selectedIds.size > 0;

  const handleSave = async () => {
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      color,
      module_ids: Array.from(selectedIds),
    };
    if (template) {
      await atualizar.mutateAsync({ id: template.id, ...payload });
    } else {
      await criar.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = criar.isPending || atualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{template ? "Editar Template" : "Novo Template"}</DialogTitle>
          <DialogDescription>
            Salve um conjunto reutilizável de módulos para aplicar em marcas/cidades.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pacote E-commerce" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cor</label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 p-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição (opcional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para que serve esse template?"
              rows={2}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar módulo…"
              className="pl-9"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{selectedIds.size} módulo(s) selecionado(s)</span>
            <div className="flex gap-2">
              <Button
                size="sm" variant="ghost"
                onClick={() => setSelectedIds(new Set((modulos ?? []).filter((m) => m.is_active && !m.is_core).map((m) => m.id)))}
              >
                Selecionar todos
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Limpar
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 border rounded-md">
          <div className="p-3 space-y-4">
            {sortedCats.map((cat) => {
              const meta = CATEGORY_META[cat];
              const catIds = grouped[cat].map((m) => m.id);
              const allOn = catIds.every((id) => selectedIds.has(id));
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-2 sticky top-0 bg-background py-1">
                    <div className="text-xs font-semibold text-muted-foreground">
                      {meta.emoji} {meta.label}
                    </div>
                    <Button
                      size="sm" variant="ghost" className="h-6 text-[10px]"
                      onClick={() => toggleAll(cat, !allOn)}
                    >
                      {allOn ? "Desmarcar todos" : "Marcar todos"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {grouped[cat].map((m) => {
                      const Icon = getIcon(m.schema_json?.icon);
                      const checked = selectedIds.has(m.id);
                      return (
                        <label
                          key={m.id}
                          className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                checked ? next.delete(m.id) : next.add(m.id);
                                return next;
                              });
                            }}
                          />
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{m.name}</div>
                            <code className="text-[10px] text-muted-foreground font-mono">{m.key}</code>
                          </div>
                          {m.customer_facing && (
                            <Badge variant="outline" className="text-[9px] shrink-0">cliente</Badge>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!podeSalvar || isPending} onClick={handleSave}>
            {template ? "Salvar alterações" : "Criar template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}