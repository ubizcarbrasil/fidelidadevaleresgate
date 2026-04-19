/**
 * SecaoCatalogoModelos — Sub-fase 5.3
 * Lista os 13 modelos de negócio agrupados por audience (Cliente/Motorista/B2B).
 * Inclui busca, filtros por audience e botão "Novo Modelo".
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import {
  useBusinessModelsCatalog,
  useToggleBusinessModelActive,
  useModulesGroupedByModel,
  type BusinessModelRow,
} from "@/compartilhados/hooks/hook_modelos_negocio_crud";
import { CardModeloNegocio } from "./card_modelo_negocio";
import { DialogEditarModelo } from "./dialog_editar_modelo";
import { DialogCriarModelo } from "./dialog_criar_modelo";

const AUDIENCE_ORDER: Array<{ key: string; label: string }> = [
  { key: "cliente", label: "Cliente" },
  { key: "motorista", label: "Motorista" },
  { key: "b2b", label: "B2B" },
];

export default function SecaoCatalogoModelos() {
  const { data, isLoading } = useBusinessModelsCatalog();
  const { data: grouped } = useModulesGroupedByModel();
  const toggleActive = useToggleBusinessModelActive();

  const [busca, setBusca] = useState("");
  const [audFiltro, setAudFiltro] = useState<string | null>(null);
  const [editing, setEditing] = useState<BusinessModelRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Contagem de módulos por modelo
  const moduleCountByModel = useMemo(() => {
    const acc: Record<string, number> = {};
    if (!grouped) return acc;
    Object.values(grouped).forEach((links) => {
      links.forEach((link) => {
        acc[link.model_id] = (acc[link.model_id] ?? 0) + 1;
      });
    });
    return acc;
  }, [grouped]);

  const filtered = useMemo(() => {
    return (data ?? []).filter((m) => {
      if (audFiltro && m.audience !== audFiltro) return false;
      if (busca) {
        const t = busca.toLowerCase();
        if (!m.name.toLowerCase().includes(t) && !m.key.toLowerCase().includes(t)) return false;
      }
      return true;
    });
  }, [data, busca, audFiltro]);

  const groupedByAudience = useMemo(() => {
    const map: Record<string, BusinessModelRow[]> = {};
    filtered.forEach((m) => {
      (map[m.audience] ||= []).push(m);
    });
    return map;
  }, [filtered]);

  const audienceCounts = useMemo(() => {
    const c: Record<string, number> = {};
    (data ?? []).forEach((m) => {
      c[m.audience] = (c[m.audience] ?? 0) + 1;
    });
    return c;
  }, [data]);

  const handleEdit = (m: BusinessModelRow) => {
    setEditing(m);
    setEditOpen(true);
  };

  const handleToggleActive = (m: BusinessModelRow) => {
    toggleActive.mutate({ id: m.id, is_active: !m.is_active });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar modelo…"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Novo Modelo
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={audFiltro === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setAudFiltro(null)}
        >
          Todos ({data?.length ?? 0})
        </Badge>
        {AUDIENCE_ORDER.map((a) => (
          <Badge
            key={a.key}
            variant={audFiltro === a.key ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setAudFiltro(a.key === audFiltro ? null : a.key)}
          >
            {a.label} ({audienceCounts[a.key] ?? 0})
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {AUDIENCE_ORDER.map((a) => {
            const items = groupedByAudience[a.key];
            if (!items?.length) return null;
            return (
              <div key={a.key}>
                <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                  {a.label} ({items.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((m) => (
                    <CardModeloNegocio
                      key={m.id}
                      modelo={m}
                      modulesCount={moduleCountByModel[m.id] ?? 0}
                      onEdit={handleEdit}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhum modelo encontrado.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <DialogEditarModelo open={editOpen} onOpenChange={setEditOpen} modelo={editing} />
      <DialogCriarModelo open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
