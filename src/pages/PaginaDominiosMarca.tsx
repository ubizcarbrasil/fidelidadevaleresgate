import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Globe, Info, Server, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface DomainRow {
  id: string;
  domain: string;
  is_primary: boolean;
  is_active: boolean;
  brand_id: string;
  created_at: string;
}

function CardInstrucoesDNS() {
  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          <CardTitle className="text-base">Como configurar seu domínio</CardTitle>
        </div>
        <CardDescription>
          Siga os passos abaixo para conectar seu domínio personalizado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3">
            <Server className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">1. Registro DNS</p>
              <p className="text-muted-foreground text-xs mt-1">
                No seu provedor de domínio, crie um registro <strong>A Record</strong> apontando para:
              </p>
              <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs font-mono">185.158.133.1</code>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3">
            <Globe className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">2. Versão www</p>
              <p className="text-muted-foreground text-xs mt-1">
                Crie também um registro <strong>A Record</strong> para <code className="text-xs">www</code> apontando para o mesmo IP.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card p-3">
            <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">3. Propagação</p>
              <p className="text-muted-foreground text-xs mt-1">
                Aguarde até <strong>72 horas</strong> para a propagação DNS. O SSL será provisionado automaticamente.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PaginaDominiosMarca() {
  const queryClient = useQueryClient();
  const { currentBrandId, enforceBrandId } = useBrandGuard();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingDomain, setEditingDomain] = useState<DomainRow | null>(null);

  // Form state
  const [domain, setDomain] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: domains, isLoading } = useQuery({
    queryKey: ["brand-domains-marca", currentBrandId],
    queryFn: async () => {
      if (!currentBrandId) return [];
      const { data, error } = await supabase
        .from("brand_domains")
        .select("id, domain, is_primary, is_active, brand_id, created_at")
        .eq("brand_id", currentBrandId)
        .order("domain");
      if (error) throw error;
      return data as DomainRow[];
    },
    enabled: !!currentBrandId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanDomain = domain.toLowerCase().trim();
      const basePayload = enforceBrandId({
        domain: cleanDomain,
        is_primary: isPrimary,
      });

      if (editingDomain) {
        const { error } = await supabase
          .from("brand_domains")
          .update(basePayload)
          .eq("id", editingDomain.id);
        if (error) throw error;
      } else {
        // Insert main domain
        const { error } = await supabase.from("brand_domains").insert(basePayload);
        if (error) throw error;

        // Auto-insert www version if not already a www domain
        if (!cleanDomain.startsWith("www.")) {
          const wwwPayload = enforceBrandId({
            domain: `www.${cleanDomain}`,
            is_primary: false,
          });
          await supabase.from("brand_domains").insert(wwwPayload);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-domains-marca"] });
      toast.success(editingDomain ? "Domínio atualizado!" : "Domínio cadastrado!");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brand_domains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-domains-marca"] });
      toast.success("Domínio removido!");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditingDomain(null);
    setDomain("");
    setIsPrimary(false);
    setDialogOpen(true);
  };

  const openEdit = (d: DomainRow) => {
    setEditingDomain(d);
    setDomain(d.domain);
    setIsPrimary(d.is_primary);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDomain(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) {
      toast.error("Preencha o domínio");
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Meus Domínios</h2>
          <p className="text-muted-foreground">Gerencie os domínios do seu aplicativo white-label</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />Novo Domínio
        </Button>
      </div>

      <CardInstrucoesDNS />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domínios Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domínio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Primário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!domains?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum domínio cadastrado. Clique em "Novo Domínio" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                domains.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {d.domain}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.is_active ? "default" : "secondary"} className="gap-1">
                        {d.is_active ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {d.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.is_primary ? "default" : "outline"}>
                        {d.is_primary ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDomain ? "Editar Domínio" : "Novo Domínio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Domínio</Label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="app.suamarca.com.br"
                required
              />
              {!editingDomain && (
                <p className="text-xs text-muted-foreground">
                  A versão <code>www</code> será cadastrada automaticamente.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
              <Label>Domínio primário</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este domínio? Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
