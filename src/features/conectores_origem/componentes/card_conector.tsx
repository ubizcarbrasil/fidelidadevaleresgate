import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Pencil, Trash2, Power, Sparkles, Link2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  triggerMirrorSync, deleteConnector, updateConnector,
} from "@/lib/api/mirrorSync";

const ICON_MAP: Record<string, any> = { Sparkles, Link2 };

interface Props {
  config: any;
  brandId: string;
  sourceLabel: string;
  sourceIcon?: string | null;
  onEditar: () => void;
}

export default function CardConector({ config, brandId, sourceLabel, sourceIcon, onEditar }: Props) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const Icon = (sourceIcon && ICON_MAP[sourceIcon]) || Sparkles;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerMirrorSync(brandId, config.source_type, config.id);
      const persisted = result?.persisted_new ?? 0;
      const updated = result?.updated ?? 0;
      toast.success(`Sincronização concluída — ${persisted} novas, ${updated} atualizadas`);
      queryClient.invalidateQueries({ queryKey: ["all-mirror-configs", brandId] });
      queryClient.invalidateQueries({ queryKey: ["mirror-deals-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["mirror-logs-latest"] });
    } catch (e: any) {
      toast.error("Erro na sincronização: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleAtivo = async (value: boolean) => {
    try {
      await updateConnector(config.id, { is_enabled: value });
      queryClient.invalidateQueries({ queryKey: ["all-mirror-configs", brandId] });
      toast.success(value ? "Conector ativado" : "Conector pausado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemover = async () => {
    try {
      await deleteConnector(config.id);
      queryClient.invalidateQueries({ queryKey: ["all-mirror-configs", brandId] });
      toast.success("Conector removido");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">
                {config.label || "Sem apelido"}
              </h3>
              <Badge variant={config.is_enabled ? "default" : "outline"}>
                {config.is_enabled ? "Ativo" : "Pausado"}
              </Badge>
              {config.auto_sync_enabled && (
                <Badge variant="secondary" className="text-xs">Auto-sync</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{sourceLabel}</p>
            {config.origin_url && (
              <p className="text-xs text-muted-foreground mt-1 truncate" title={config.origin_url}>
                {config.origin_url}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <Switch checked={config.is_enabled} onCheckedChange={handleToggleAtivo} />
            <span className="text-xs text-muted-foreground">
              <Power className="inline h-3 w-3 mr-1" /> Ativo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || !config.is_enabled}>
              <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
            <Button variant="outline" size="icon" onClick={onEditar} aria-label="Editar conector">
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Remover conector">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover este conector?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O conector "{config.label}" será excluído. As ofertas já importadas <strong>continuam</strong>
                    {" "}no sistema, mas deixarão de ser sincronizadas a partir desta URL.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemover}>Remover</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}