import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, Pencil, Globe, Car, Users, RefreshCw, HandCoins, RotateCcw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import DialogResetPontos from "@/components/branch/DialogResetPontos";
import DialogCriarFranqueado from "@/components/branch/DialogCriarFranqueado";
import DialogReprocessarPontos from "@/components/branch/DialogReprocessarPontos";

export default function BrandBranchesPage() {
  const navigate = useNavigate();
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [resetBranch, setResetBranch] = useState<{ id: string; name: string } | null>(null);
  const [franqueadoBranch, setFranqueadoBranch] = useState<{ id: string; name: string } | null>(null);
  const [reprocessBranch, setReprocessBranch] = useState<{ id: string; name: string } | null>(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["brand-branches", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, city, state, is_active, created_at, scoring_model, is_city_redemption_enabled")
        .eq("brand_id", currentBrandId)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentBrandId,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("branches")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-branches"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const ativas = branches.filter((b) => b.is_active).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Minhas Cidades"
        description="Gerencie as cidades onde sua marca opera."
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Card className="rounded-xl border-0 shadow-sm bg-primary/5 px-4 py-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{ativas}</span>
              <span className="text-xs text-muted-foreground">cidades ativas</span>
            </div>
          </Card>
        </div>
        <Button size="sm" onClick={() => navigate("/brand-branches/new")}>
          <Plus className="h-4 w-4 mr-1" />
          Nova Cidade
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
      ) : branches.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Nenhuma cidade cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {branches.map((branch) => (
            <Card key={branch.id} className="rounded-xl">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {branch.city || branch.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {branch.state || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <Switch
                      checked={branch.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: branch.id, is_active: checked })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap pl-0 sm:pl-12">
                  {(branch as any).scoring_model === "DRIVER_ONLY" && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Car className="h-3 w-3" /> Motorista
                    </Badge>
                  )}
                  {(branch as any).scoring_model === "PASSENGER_ONLY" && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Users className="h-3 w-3" /> Cliente
                    </Badge>
                  )}
                  {((branch as any).scoring_model === "BOTH" || !(branch as any).scoring_model) && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <RefreshCw className="h-3 w-3" /> Misto
                    </Badge>
                  )}
                  {(branch as any).is_city_redemption_enabled && (
                    <Badge variant="outline" className="text-[10px] gap-1 text-green-600 border-green-600/30">
                      <HandCoins className="h-3 w-3" /> Resgate Cidade
                    </Badge>
                  )}
                  <Badge variant={branch.is_active ? "default" : "secondary"} className="text-[10px]">
                    {branch.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap pl-0 sm:pl-12">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setFranqueadoBranch({ id: branch.id, name: branch.city || branch.name })}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Criar Franqueado
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setReprocessBranch({ id: branch.id, name: branch.city || branch.name })}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reprocessar Pontos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setResetBranch({ id: branch.id, name: branch.city || branch.name })}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Resetar pontos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => navigate(`/brand-branches/${branch.id}`)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DialogResetPontos
        open={!!resetBranch}
        onClose={() => setResetBranch(null)}
        branchId={resetBranch?.id || ""}
        branchName={resetBranch?.name || ""}
      />

      <DialogCriarFranqueado
        open={!!franqueadoBranch}
        onClose={() => setFranqueadoBranch(null)}
        brandId={currentBrandId || ""}
        branchId={franqueadoBranch?.id || ""}
        branchName={franqueadoBranch?.name || ""}
      />

      <DialogReprocessarPontos
        open={!!reprocessBranch}
        onClose={() => setReprocessBranch(null)}
        branchId={reprocessBranch?.id || ""}
        branchName={reprocessBranch?.name || ""}
      />
    </div>
  );
}
