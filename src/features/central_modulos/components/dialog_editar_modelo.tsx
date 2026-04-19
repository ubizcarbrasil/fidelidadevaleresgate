/**
 * DialogEditarModelo — Sub-fase 5.3
 * Dialog de edição de um Business Model com 3 seções:
 *   1. Identidade (editáveis: name, description, icon, color, sort_order, is_active)
 *   2. Imutáveis (key, audience, pricing_model — read-only)
 *   3. Vínculos com Módulos Técnicos (lista com checkbox + switch req/opt)
 */
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import {
  useBusinessModelModules,
  useUpdateBusinessModel,
  useSetBusinessModelModule,
  type BusinessModelRow,
} from "@/compartilhados/hooks/hook_modelos_negocio_crud";
import { useCatalogoModulos } from "../hooks/hook_catalogo";

interface DialogEditarModeloProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  modelo: BusinessModelRow | null;
}

export function DialogEditarModelo({ open, onOpenChange, modelo }: DialogEditarModeloProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [busca, setBusca] = useState("");

  const { data: modulos, isLoading: loadModulos } = useCatalogoModulos();
  const { data: vinculos } = useBusinessModelModules(modelo?.id);
  const update = useUpdateBusinessModel();
  const setLink = useSetBusinessModelModule();

  // Reset ao abrir
  useEffect(() => {
    if (open && modelo) {
      setName(modelo.name);
      setDescription(modelo.description ?? "");
      setIcon(modelo.icon ?? "");
      setColor(modelo.color ?? "#6366F1");
      setSortOrder(modelo.sort_order);
      setIsActive(modelo.is_active);
      setBusca("");
    }
  }, [open, modelo]);

  const vinculosMap = useMemo(() => {
    const m = new Map<string, boolean>();
    (vinculos ?? []).forEach((v) => m.set(v.module_definition_id, v.is_required));
    return m;
  }, [vinculos]);

  const modulosFiltrados = useMemo(() => {
    const ativos = (modulos ?? []).filter((m) => m.is_active);
    if (!busca) return ativos;
    const t = busca.toLowerCase();
    return ativos.filter(
      (m) => m.name.toLowerCase().includes(t) || m.key.toLowerCase().includes(t)
    );
  }, [modulos, busca]);

  if (!modelo) return null;

  const handleSalvar = async () => {
    await update.mutateAsync({
      id: modelo.id,
      input: {
        name,
        description: description || null,
        icon: icon || null,
        color: color || null,
        sort_order: sortOrder,
        is_active: isActive,
      },
    });
    onOpenChange(false);
  };

  const handleToggleVinculo = (moduleId: string, currentlyLinked: boolean, currentRequired: boolean) => {
    setLink.mutate({
      business_model_id: modelo.id,
      module_definition_id: moduleId,
      linked: !currentlyLinked,
      is_required: currentRequired,
    });
  };

  const handleToggleRequired = (moduleId: string, newRequired: boolean) => {
    setLink.mutate({
      business_model_id: modelo.id,
      module_definition_id: moduleId,
      linked: true,
      is_required: newRequired,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col z-[90]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Modelo de Negócio
            <Badge variant="outline" className="font-mono text-xs">{modelo.key}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-1">
          {/* Seção 1: Identidade */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Identidade</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bm-name">Nome</Label>
                <Input id="bm-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="bm-icon">Ícone (lucide)</Label>
                <Input
                  id="bm-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="Ex.: Briefcase"
                />
              </div>
              <div>
                <Label htmlFor="bm-color">Cor (HEX)</Label>
                <div className="flex gap-2">
                  <Input
                    id="bm-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 p-1 h-10"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6366F1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bm-sort">Ordem</Label>
                <Input
                  id="bm-sort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bm-desc">Descrição</Label>
                <Textarea
                  id="bm-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Modelos inativos não aparecem para empreendedores nem cidades.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </section>

          <Separator />

          {/* Seção 2: Imutáveis */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Imutáveis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <Label className="text-muted-foreground">Key</Label>
                <code className="block mt-1 px-2 py-1.5 rounded bg-muted text-xs font-mono">{modelo.key}</code>
              </div>
              <div>
                <Label className="text-muted-foreground">Audience</Label>
                <code className="block mt-1 px-2 py-1.5 rounded bg-muted text-xs font-mono">{modelo.audience}</code>
              </div>
              <div>
                <Label className="text-muted-foreground">Pricing</Label>
                <code className="block mt-1 px-2 py-1.5 rounded bg-muted text-xs font-mono">{modelo.pricing_model}</code>
              </div>
            </div>
          </section>

          <Separator />

          {/* Seção 3: Vínculos */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Vínculos com Módulos Técnicos</h3>
              <span className="text-xs text-muted-foreground">{vinculosMap.size} vinculado(s)</span>
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
            <ScrollArea className="h-64 border rounded-md">
              {loadModulos ? (
                <div className="p-4 text-sm text-muted-foreground">Carregando…</div>
              ) : (
                <div className="divide-y">
                  {modulosFiltrados.map((m) => {
                    const linked = vinculosMap.has(m.id);
                    const required = vinculosMap.get(m.id) ?? false;
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                        <Checkbox
                          checked={linked}
                          onCheckedChange={() => handleToggleVinculo(m.id, linked, required)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{m.name}</div>
                          <code className="text-[10px] text-muted-foreground font-mono">{m.key}</code>
                        </div>
                        {linked && (
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`req-${m.id}`} className="text-xs text-muted-foreground">
                              Required
                            </Label>
                            <Switch
                              id={`req-${m.id}`}
                              checked={required}
                              onCheckedChange={(v) => handleToggleRequired(m.id, v)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {modulosFiltrados.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      Nenhum módulo encontrado.
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={update.isPending}>
            {update.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
