import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Users, Trash2, Filter } from "lucide-react";

interface AudienceFilters {
  gender?: string;
  os_platform?: string;
  source?: string;
  min_events?: number;
  max_events?: number;
}

export default function CrmAudiencesPage() {
  const { currentBrandId } = useBrandGuard();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<AudienceFilters>({});

  const { data: audiences, isLoading } = useQuery({
    queryKey: ["crm-audiences", currentBrandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_audiences")
        .select("*")
        .eq("brand_id", currentBrandId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentBrandId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Estimate count
      let query = supabase
        .from("crm_contacts")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", currentBrandId!)
        .eq("is_active", true);

      if (filters.gender) query = query.eq("gender", filters.gender);
      if (filters.os_platform) query = query.eq("os_platform", filters.os_platform);
      if (filters.source) query = query.eq("source", filters.source);

      const { count } = await query;

      const { error } = await supabase.from("crm_audiences").insert([{
        brand_id: currentBrandId!,
        name,
        description,
        filters_json: filters as any,
        estimated_count: count || 0,
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-audiences"] });
      setShowCreate(false);
      setName("");
      setDescription("");
      setFilters({});
      toast({ title: "Público criado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao criar público", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_audiences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-audiences"] });
      toast({ title: "Público removido" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Públicos" description="Crie segmentos de contatos para campanhas de disparo" />
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Público
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(audiences || []).map((aud) => {
            const f = aud.filters_json as AudienceFilters;
            return (
              <Card key={aud.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{aud.name}</h3>
                      {aud.description && <p className="text-sm text-muted-foreground mt-1">{aud.description}</p>}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {f?.gender && <Badge variant="secondary">Gênero: {f.gender}</Badge>}
                        {f?.os_platform && <Badge variant="secondary">SO: {f.os_platform}</Badge>}
                        {f?.source && <Badge variant="secondary">Origem: {f.source}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{aud.estimated_count}</p>
                        <p className="text-xs text-muted-foreground">contatos</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(aud.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {(audiences || []).length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum público criado ainda</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Público</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do público</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mulheres iOS ativas" />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Gênero</Label>
                <Select value={filters.gender || ""} onValueChange={(v) => setFilters(f => ({ ...f, gender: v === "all" ? undefined : v }))}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sistema</Label>
                <Select value={filters.os_platform || ""} onValueChange={(v) => setFilters(f => ({ ...f, os_platform: v === "all" ? undefined : v }))}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="iOS">iOS</SelectItem>
                    <SelectItem value="Android">Android</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Origem</Label>
                <Select value={filters.source || ""} onValueChange={(v) => setFilters(f => ({ ...f, source: v === "all" ? undefined : v }))}>
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="MOBILITY_APP">Mobilidade</SelectItem>
                    <SelectItem value="LOYALTY">Fidelidade</SelectItem>
                    <SelectItem value="STORE_UPLOAD">Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Público"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
