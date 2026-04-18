// Fase 4.1b — chunk version bump para forçar invalidação de CDN
export const __PHASE_4_1B_CAT_REBUILD = "2026-04-18-v3";
import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Blocks, Building2, MapPin } from "lucide-react";
import { CATEGORY_META, ORDEM_CATEGORIAS } from "@/compartilhados/constants/constantes_categorias_modulos";
import {
  useCatalogoModulos, useToggleModuloAtivo, useDeletarModulo, useModulosUsoCount,
  type ModuleDefinitionRow,
} from "../hooks/hook_catalogo";
import ModalModuloForm from "./modal_modulo_form";

function getIcon(name?: string): React.ComponentType<any> {
  if (!name) return Blocks;
  const Comp = (Icons as any)[name];
  return Comp ?? Blocks;
}

export default function AbaCatalogo() {
  const { data, isLoading } = useCatalogoModulos();
  const toggleAtivo = useToggleModuloAtivo();
  const deletar = useDeletarModulo();

  const [busca, setBusca] = useState("");
  const [catFiltro, setCatFiltro] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ModuleDefinitionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModuleDefinitionRow | null>(null);

  const grouped = useMemo(() => {
    const filtered = (data ?? []).filter((m) => {
      if (catFiltro && m.category !== catFiltro) return false;
      if (busca) {
        const t = busca.toLowerCase();
        if (!m.name.toLowerCase().includes(t) && !m.key.toLowerCase().includes(t)) return false;
      }
      return true;
    });
    const map: Record<string, ModuleDefinitionRow[]> = {};
    filtered.forEach((m) => {
      const cat = CATEGORY_META[m.category] ? m.category : "general";
      (map[cat] ||= []).push(m);
    });
    return map;
  }, [data, busca, catFiltro]);

  const sortedCats = ORDEM_CATEGORIAS.filter((c) => grouped[c]?.length);

  const abrirNovo = () => { setEditing(null); setModalOpen(true); };
  const abrirEditar = (m: ModuleDefinitionRow) => { setEditing(m); setModalOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou chave…" className="pl-9" />
        </div>
        <Button onClick={abrirNovo} className="w-full sm:w-auto"><Plus className="h-4 w-4" /> Novo Módulo</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={catFiltro === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setCatFiltro(null)}>
          Todas ({data?.length ?? 0})
        </Badge>
        {ORDEM_CATEGORIAS.filter((c) => c !== "general").map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = (data ?? []).filter((m) => m.category === cat).length;
          return (
            <Badge key={cat} variant={catFiltro === cat ? "default" : "outline"} className="cursor-pointer" onClick={() => setCatFiltro(cat === catFiltro ? null : cat)}>
              {meta.emoji} {meta.label} ({count})
            </Badge>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-6">
          {sortedCats.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <div key={cat}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <span>{meta.emoji}</span><span>{meta.label}</span>
                  <span className="text-muted-foreground text-xs">— {meta.description}</span>
                </h3>
                <div className="grid gap-2">
                  {grouped[cat].map((m) => {
                    const Icon = getIcon(m.schema_json?.icon);
                    return (
                      <Card key={m.id} className={!m.is_active ? "opacity-60" : ""}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{m.name}</span>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{m.key}</code>
                              {m.is_core && <Badge variant="secondary" className="text-[10px]">Core</Badge>}
                              {!m.is_active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                              {m.customer_facing && <Badge variant="outline" className="text-[10px]">Cliente</Badge>}
                            </div>
                            {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => toggleAtivo.mutate({ id: m.id, is_active: !m.is_active })} title={m.is_active ? "Desativar" : "Ativar"}>
                              {m.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => abrirEditar(m)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" disabled={m.is_core} onClick={() => setDeleteTarget(m)} title={m.is_core ? "Módulos core não podem ser removidos" : "Remover"}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {sortedCats.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum módulo encontrado.</CardContent></Card>
          )}
        </div>
      )}

      <ModalModuloForm open={modalOpen} onOpenChange={setModalOpen} initial={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover módulo?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover <strong>{deleteTarget?.name}</strong> ({deleteTarget?.key}). Marcas e cidades que o utilizam perderão a configuração. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) { deletar.mutate(deleteTarget.id); setDeleteTarget(null); } }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
