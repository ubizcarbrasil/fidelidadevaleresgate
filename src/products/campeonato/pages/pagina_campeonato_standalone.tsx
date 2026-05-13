import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaginaCampeonatoEmpreendedor from "../pagina_campeonato_empreendedor";
import PaginaAtivacaoStandalone from "./pagina_ativacao_standalone";
import { useCampeonatoStandalone } from "../hooks/hook_campeonato_standalone";

/**
 * Rota `/campeonato` (produto standalone).
 *
 * - Sem `campeonato_standalone_enabled = true`: mostra a tela de ativação.
 * - Ativo + escopo BRAND/ROOT sem cidade: seletor de cidade.
 * - Ativo + cidade definida: renderiza o painel do empreendedor existente.
 */
export default function PaginaCampeonatoStandalone() {
  const { currentBrandId, currentBranchId, consoleScope } = useBrandGuard();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const isBrandScope = consoleScope === "BRAND" || consoleScope === "ROOT";
  const effectiveBranchId = isBrandScope ? selectedBranchId : currentBranchId;

  const { standalone, isLoading: loadingFlag } =
    useCampeonatoStandalone(currentBrandId);

  const { data: branches, isLoading: loadingBranches } = useQuery({
    queryKey: ["branches-for-campeonato-standalone", currentBrandId],
    enabled: standalone && isBrandScope && !!currentBrandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  if (loadingFlag) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentBrandId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Nenhuma marca selecionada.
      </div>
    );
  }

  if (!standalone) {
    return <PaginaAtivacaoStandalone brandId={currentBrandId} />;
  }

  if (loadingBranches) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isBrandScope && !effectiveBranchId) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Campeonato</h1>
            <p className="text-sm text-muted-foreground">
              Temporadas, séries e prêmios
            </p>
          </div>
        </div>

        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
          <MapPin className="h-10 w-10 text-muted-foreground" />
          <p className="text-center text-muted-foreground">
            Selecione uma cidade para gerenciar o campeonato
          </p>
          <Select onValueChange={(val) => setSelectedBranchId(val)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Escolha a cidade" />
            </SelectTrigger>
            <SelectContent>
              {branches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (!effectiveBranchId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Nenhuma cidade selecionada.
      </div>
    );
  }

  return (
    <PaginaCampeonatoEmpreendedor
      brandId={currentBrandId}
      branchId={effectiveBranchId}
    />
  );
}