import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { History, ToggleLeft, ToggleRight, Trash2, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuditoriaModulos } from "../hooks/hook_auditoria_modulos";
import { useCatalogoModulos } from "../hooks/hook_catalogo";

function ActionIcon({ action, newEnabled }: { action: string; newEnabled: boolean | null }) {
  if (action === "MODULE_REMOVED") return <Trash2 className="h-4 w-4 text-destructive" />;
  if (newEnabled) return <ToggleRight className="h-4 w-4 text-primary" />;
  return <ToggleLeft className="h-4 w-4 text-muted-foreground" />;
}

function actionLabel(action: string, newEnabled: boolean | null) {
  if (action === "MODULE_REMOVED") return "Removido";
  if (action === "MODULE_ENABLED" || newEnabled === true) return "Ativado";
  if (action === "MODULE_DISABLED" || newEnabled === false) return "Desativado";
  return action;
}

export default function AbaAuditoria() {
  const qc = useQueryClient();
  const [brandId, setBrandId] = useState<string>("all");
  const [moduleId, setModuleId] = useState<string>("all");

  const { data: brands } = useQuery({
    queryKey: ["brands-list-audit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: modules } = useCatalogoModulos();

  const { data: rows, isLoading, refetch, isFetching } = useAuditoriaModulos({
    brandId: brandId === "all" ? null : brandId,
    moduleDefinitionId: moduleId === "all" ? null : moduleId,
    limit: 300,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="text-xs text-muted-foreground mb-1 block">Marca</label>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands?.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-xs text-muted-foreground mb-1 block">Módulo</label>
          <Select value={moduleId} onValueChange={setModuleId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os módulos</SelectItem>
              {modules?.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => { qc.invalidateQueries({ queryKey: ["audit-brand-modules"] }); refetch(); }} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : !rows || rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground space-y-2">
            <History className="h-8 w-8 mx-auto opacity-40" />
            <p className="text-sm">Nenhum registro encontrado.</p>
            <p className="text-xs">As alterações futuras de ativação/desativação de módulos aparecerão aqui automaticamente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <ActionIcon action={r.action} newEnabled={r.new_enabled} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={r.action === "MODULE_REMOVED" ? "destructive" : r.new_enabled ? "default" : "outline"} className="text-[10px]">
                      {actionLabel(r.action, r.new_enabled)}
                    </Badge>
                    <span className="font-medium truncate">{r.module_name ?? r.module_key ?? "Módulo desconhecido"}</span>
                    {r.module_key && (
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{r.module_key}</code>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Marca: <strong>{r.brand_name ?? "—"}</strong></span>
                    <span>Por: <strong>{r.actor_email ?? (r.actor_user_id ? r.actor_user_id.slice(0, 8) : "Sistema")}</strong></span>
                    <span title={format(new Date(r.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}>
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
