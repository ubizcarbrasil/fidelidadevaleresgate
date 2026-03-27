import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Archive, Power, Loader2 } from "lucide-react";
import { STATUS_LABELS, type SourceSystem } from "@/lib/api/offerGovernance";

interface Props {
  brandId: string;
  origin: SourceSystem;
}

export default function GovernanceCleanup({ brandId, origin }: Props) {
  const queryClient = useQueryClient();
  const [statusAlvo, setStatusAlvo] = useState("removed_from_source");
  const [executando, setExecutando] = useState(false);

  const executarLimpeza = async (action: "archive" | "deactivate") => {
    setExecutando(true);
    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (action === "archive") {
        updateData.current_status = "archived";
        updateData.is_active = false;
      } else {
        updateData.is_active = false;
        updateData.current_status = "inactive";
      }

      const { error, count } = await supabase
        .from("affiliate_deals")
        .update(updateData)
        .eq("brand_id", brandId)
        .eq("origin", origin)
        .eq("current_status", statusAlvo);

      if (error) throw error;

      toast.success(`Limpeza concluída. ${count ?? 0} ofertas afetadas.`);
      queryClient.invalidateQueries({ queryKey: ["governance"] });
    } catch {
      toast.error("Erro ao executar limpeza");
    } finally {
      setExecutando(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-destructive" />
          Limpeza em Massa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione o status das ofertas que deseja limpar. Esta ação afeta apenas ofertas da origem <strong>{origin === "dvlinks" ? "Divulga Link" : "Divulgador Inteligente"}</strong>.
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status alvo</label>
          <Select value={statusAlvo} onValueChange={setStatusAlvo}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => executarLimpeza("deactivate")}
            disabled={executando}
          >
            {executando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Power className="h-4 w-4 mr-2" />}
            Desativar selecionadas
          </Button>
          <Button
            variant="outline"
            onClick={() => executarLimpeza("archive")}
            disabled={executando}
          >
            {executando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
            Arquivar selecionadas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
