import { useMemo, useState } from "react";
import { Layers, Search, CheckSquare, Square, Power, PowerOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCatalogoModulos } from "../hooks/hook_catalogo";
import { useBrandList, useBulkApplyModule } from "../hooks/hook_brand_modules_admin";

export default function PainelAplicacaoMassa() {
  const { data: brands = [], isLoading: loadingBrands } = useBrandList();
  const { data: catalogo = [] } = useCatalogoModulos();
  const bulkMut = useBulkApplyModule();

  const [moduleId, setModuleId] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [confirmAcao, setConfirmAcao] = useState<"on" | "off" | null>(null);

  const modulosOrdenados = useMemo(
    () => [...catalogo].filter((m) => m.is_active && !m.is_core).sort((a, b) => a.name.localeCompare(b.name)),
    [catalogo]
  );

  const moduloSelecionado = catalogo.find((m) => m.id === moduleId);

  const brandsFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(term));
  }, [brands, busca]);

  const toggleBrand = (id: string) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const todasVisiveisMarcadas = brandsFiltradas.length > 0 && brandsFiltradas.every((b) => selecionadas.has(b.id));
  const toggleTodasVisiveis = () => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (todasVisiveisMarcadas) brandsFiltradas.forEach((b) => next.delete(b.id));
      else brandsFiltradas.forEach((b) => next.add(b.id));
      return next;
    });
  };

  const limparSelecao = () => setSelecionadas(new Set());

  const podeAplicar = !!moduleId && selecionadas.size > 0 && !bulkMut.isPending;

  const aplicar = (isEnabled: boolean) => {
    if (!moduleId || selecionadas.size === 0) return;
    bulkMut.mutate(
      { brandIds: Array.from(selecionadas), moduleDefinitionId: moduleId, isEnabled },
      {
        onSuccess: () => {
          setConfirmAcao(null);
          // mantém seleção pra permitir aplicar outro módulo no mesmo grupo
        },
      }
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Aplicação em massa
          <Badge variant="outline" className="ml-auto text-[10px]">
            {selecionadas.size} marca(s) selecionada(s)
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Escolha um módulo, marque várias marcas e aplique ON/OFF de uma vez. Módulos core não aparecem aqui.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Seleção do módulo */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Módulo</label>
          <Select value={moduleId} onValueChange={setModuleId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha o módulo a aplicar…" />
            </SelectTrigger>
            <SelectContent>
              {modulosOrdenados.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                  <span className="text-muted-foreground ml-2 text-xs">({m.key})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Busca + selecionar todas */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar marcas…"
              className="pl-9 h-9"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={toggleTodasVisiveis}
            disabled={brandsFiltradas.length === 0}
          >
            {todasVisiveisMarcadas ? <CheckSquare className="h-3.5 w-3.5 mr-1" /> : <Square className="h-3.5 w-3.5 mr-1" />}
            {todasVisiveisMarcadas ? "Desmarcar visíveis" : "Marcar visíveis"}
          </Button>
          {selecionadas.size > 0 && (
            <Button type="button" size="sm" variant="ghost" onClick={limparSelecao}>
              Limpar ({selecionadas.size})
            </Button>
          )}
        </div>

        {/* Lista de marcas */}
        <ScrollArea className="h-56 border rounded-md bg-muted/20">
          {loadingBrands ? (
            <div className="p-4 text-sm text-muted-foreground">Carregando marcas…</div>
          ) : brandsFiltradas.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Nenhuma marca encontrada.</div>
          ) : (
            <ul className="divide-y">
              {brandsFiltradas.map((b) => {
                const checked = selecionadas.has(b.id);
                return (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleBrand(b.id)}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleBrand(b.id)} />
                    <span className="text-sm flex-1 truncate">{b.name}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {b.subscription_plan}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            className="flex-1"
            disabled={!podeAplicar}
            onClick={() => setConfirmAcao("on")}
          >
            <Power className="h-4 w-4 mr-1.5" />
            Ativar nas selecionadas
          </Button>
          <Button
            className="flex-1"
            variant="destructive"
            disabled={!podeAplicar}
            onClick={() => setConfirmAcao("off")}
          >
            <PowerOff className="h-4 w-4 mr-1.5" />
            Desativar nas selecionadas
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={confirmAcao !== null} onOpenChange={(o) => !o && setConfirmAcao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAcao === "on" ? "Ativar" : "Desativar"} módulo em {selecionadas.size} marca(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vai {confirmAcao === "on" ? "ativar" : "desativar"} o módulo{" "}
              <strong>{moduloSelecionado?.name}</strong> em todas as marcas selecionadas.
              A mudança aparece imediatamente nos painéis das marcas e fica registrada na aba Auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => aplicar(confirmAcao === "on")}
              disabled={bulkMut.isPending}
            >
              {bulkMut.isPending ? "Aplicando…" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
