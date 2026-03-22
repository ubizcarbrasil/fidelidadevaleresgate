import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";

interface DomainRow {
  id: string;
  domain: string;
  is_primary: boolean;
  brand_id: string;
  created_at: string;
  brands: { name: string } | null;
}

export default function BrandDomains() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingDomain, setEditingDomain] = useState<DomainRow | null>(null);
  const [filterBrandId, setFilterBrandId] = useState<string>("all");

  // Form state
  const [domain, setDomain] = useState("");
  const [brandId, setBrandId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: domains, isLoading } = useQuery({
    queryKey: ["brand-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_domains")
        .select("*, brands(name)")
        .order("domain");
      if (error) throw error;
      return data as DomainRow[];
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands-select"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { domain: domain.toLowerCase().trim(), brand_id: brandId, is_primary: isPrimary };
      if (editingDomain) {
        const { error } = await supabase.from("brand_domains").update(payload).eq("id", editingDomain.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_domains").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-domains"] });
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
      queryClient.invalidateQueries({ queryKey: ["brand-domains"] });
      toast.success("Domínio removido!");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditingDomain(null);
    setDomain("");
    setBrandId("");
    setIsPrimary(false);
    setDialogOpen(true);
  };

  const openEdit = (d: DomainRow) => {
    setEditingDomain(d);
    setDomain(d.domain);
    setBrandId(d.brand_id);
    setIsPrimary(d.is_primary);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDomain(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !brandId) {
      toast.error("Preencha todos os campos obrigatórios");
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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Domínios</h2>
          <p className="text-muted-foreground">Gerencie os domínios white-label das brands</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />Novo Domínio
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Lista de Domínios</CardTitle>
          <Select value={filterBrandId} onValueChange={setFilterBrandId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as brands</SelectItem>
              {brands?.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domínio</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Primário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const filtered = filterBrandId === "all"
                  ? domains
                  : domains?.filter((d) => d.brand_id === filterBrandId);
                if (!filtered?.length) {
                  return (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum domínio encontrado
                      </TableCell>
                    </TableRow>
                  );
                }
                return filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {d.domain}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.brands?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.is_primary ? "default" : "secondary"}>
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
                ));
              })()}
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
                placeholder="app.minhammarca.com.br"
                required
              />
            </div>
            <div className="space-y-2">
               <Label>Marca</Label>
               <Select value={brandId} onValueChange={setBrandId}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
