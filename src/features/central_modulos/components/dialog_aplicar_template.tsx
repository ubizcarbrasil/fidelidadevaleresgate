import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Building2, MapPin, AlertTriangle } from "lucide-react";
import {
  useBrandsParaTemplate, useBranchesParaTemplate,
  useAplicarModuleTemplate,
  type ModuleTemplateWithItems, type AplicacaoMode,
} from "../hooks/hook_module_templates";

export default function DialogAplicarTemplate({
  open, onOpenChange, template,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: ModuleTemplateWithItems | null;
}) {
  const { data: brands } = useBrandsParaTemplate();
  const { data: branches } = useBranchesParaTemplate();
  const aplicar = useAplicarModuleTemplate();

  const [brandIds, setBrandIds] = useState<Set<string>>(new Set());
  const [branchIds, setBranchIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<AplicacaoMode>("merge");
  const [buscaBrand, setBuscaBrand] = useState("");
  const [buscaBranch, setBuscaBranch] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const brandsFiltradas = useMemo(() => {
    const t = buscaBrand.toLowerCase();
    return (brands ?? []).filter(
      (b) => !t || b.name.toLowerCase().includes(t) || b.slug.toLowerCase().includes(t),
    );
  }, [brands, buscaBrand]);

  const branchesFiltradas = useMemo(() => {
    const t = buscaBranch.toLowerCase();
    return (branches ?? []).filter(
      (b) =>
        !t ||
        b.name.toLowerCase().includes(t) ||
        (b.city ?? "").toLowerCase().includes(t) ||
        b.brand_name.toLowerCase().includes(t),
    );
  }, [branches, buscaBranch]);

  const totalAlvos = brandIds.size + branchIds.size;
  const exigeConfirm = mode === "replace" && totalAlvos > 0;
  const podeAplicar =
    !!template && totalAlvos > 0 && (!exigeConfirm || confirmText === "CONFIRMAR");

  const handleAplicar = async () => {
    if (!template) return;
    await aplicar.mutateAsync({
      template_id: template.id,
      brand_ids: Array.from(brandIds),
      branch_ids: Array.from(branchIds),
      mode,
    });
    setBrandIds(new Set());
    setBranchIds(new Set());
    setConfirmText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Aplicar template{template ? ` "${template.name}"` : ""}
          </DialogTitle>
          <DialogDescription>
            Selecione marcas e/ou cidades, escolha a política de merge e confirme.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border p-3">
            <div className="text-xs font-medium mb-2">Política de aplicação</div>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as AplicacaoMode)}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="merge" id="merge" />
                <Label htmlFor="merge" className="font-normal cursor-pointer">
                  <span className="font-medium">Mesclar (recomendado)</span>
                  <p className="text-xs text-muted-foreground">
                    Adiciona/liga os módulos do template. Não desativa nenhum módulo já configurado.
                  </p>
                </Label>
              </div>
              <div className="flex items-start gap-2 mt-1">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="font-normal cursor-pointer">
                  <span className="font-medium">Substituir</span>
                  <p className="text-xs text-muted-foreground">
                    Apaga as linhas dos módulos do template no alvo e regrava do zero.
                    Outros módulos fora do template permanecem intocados.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Tabs defaultValue="brands" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="brands" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Marcas ({brandIds.size})
              </TabsTrigger>
              <TabsTrigger value="branches" className="gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Cidades ({branchIds.size})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="brands" className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={buscaBrand} onChange={(e) => setBuscaBrand(e.target.value)}
                  placeholder="Buscar marca…" className="pl-9"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm" variant="ghost"
                  onClick={() => setBrandIds(new Set(brandsFiltradas.map((b) => b.id)))}
                >
                  Selecionar visíveis
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setBrandIds(new Set())}>
                  Limpar
                </Button>
              </div>
              <ScrollArea className="h-64 border rounded-md">
                <div className="p-2 space-y-1">
                  {brandsFiltradas.map((b) => {
                    const checked = brandIds.has(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 rounded-md p-2 cursor-pointer hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => {
                            setBrandIds((prev) => {
                              const next = new Set(prev);
                              checked ? next.delete(b.id) : next.add(b.id);
                              return next;
                            });
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{b.name}</div>
                          <div className="text-[10px] text-muted-foreground">{b.slug}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{b.subscription_plan}</Badge>
                      </label>
                    );
                  })}
                  {brandsFiltradas.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3 text-center">Nenhuma marca encontrada.</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="branches" className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={buscaBranch} onChange={(e) => setBuscaBranch(e.target.value)}
                  placeholder="Buscar cidade…" className="pl-9"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm" variant="ghost"
                  onClick={() => setBranchIds(new Set(branchesFiltradas.map((b) => b.id)))}
                >
                  Selecionar visíveis
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setBranchIds(new Set())}>
                  Limpar
                </Button>
              </div>
              <ScrollArea className="h-64 border rounded-md">
                <div className="p-2 space-y-1">
                  {branchesFiltradas.map((b) => {
                    const checked = branchIds.has(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 rounded-md p-2 cursor-pointer hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => {
                            setBranchIds((prev) => {
                              const next = new Set(prev);
                              checked ? next.delete(b.id) : next.add(b.id);
                              return next;
                            });
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{b.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {b.brand_name}{b.city ? ` · ${b.city}` : ""}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  {branchesFiltradas.length === 0 && (
                    <p className="text-xs text-muted-foreground p-3 text-center">Nenhuma cidade encontrada.</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {exigeConfirm && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Substituição em {totalAlvos} alvo(s)
              </div>
              <p className="text-xs">
                As linhas dos {template?.items.length ?? 0} módulo(s) do template serão apagadas e regravadas.
                Para confirmar, digite <code className="bg-muted px-1">CONFIRMAR</code>:
              </p>
              <Input
                value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!podeAplicar || aplicar.isPending} onClick={handleAplicar}>
            Aplicar em {totalAlvos} alvo(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}