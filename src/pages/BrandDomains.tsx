import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Globe, CheckCircle2, XCircle, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";

interface DomainRow {
  id: string;
  domain: string;
  is_primary: boolean;
  is_active: boolean;
  subdomain: string | null;
  brand_id: string;
  created_at: string;
  brands: { name: string; slug: string } | null;
}

interface BrandSimple {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

/** Brands that have NO domain registered at all */
function CardSemDominio({ brands, domains }: { brands: BrandSimple[]; domains: DomainRow[] }) {
  const brandIdsComDominio = useMemo(
    () => new Set(domains.map((d) => d.brand_id)),
    [domains]
  );
  const semDominio = useMemo(
    () => brands.filter((b) => !brandIdsComDominio.has(b.id)),
    [brands, brandIdsComDominio]
  );

  if (semDominio.length === 0) return null;

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-base">Brands sem domínio ({semDominio.length})</CardTitle>
        </div>
        <CardDescription>Estas brands não possuem nenhum domínio configurado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {semDominio.map((b) => (
            <Badge key={b.id} variant="outline" className="gap-1.5">
              <XCircle className="h-3 w-3 text-yellow-500" />
              {b.name}
              <span className="text-muted-foreground text-[10px]">({b.slug})</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BrandDomains() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingDomain, setEditingDomain] = useState<DomainRow | null>(null);
  const [filterBrandId, setFilterBrandId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [domain, setDomain] = useState("");
  const [brandId, setBrandId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [subdomain, setSubdomain] = useState("");

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["brand-domains-root"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_domains")
        .select("*, brands(name, slug)")
        .order("domain");
      if (error) throw error;
      return data as DomainRow[];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-select-root"],
    queryFn: async () => {
      const { data } = await supabase
        .from("brands")
        .select("id, name, slug, is_active")
        .order("name");
      return (data || []) as BrandSimple[];
    },
  });

  const filtered = useMemo(() => {
    let result = domains;
    if (filterBrandId !== "all") {
      result = result.filter((d) => d.brand_id === filterBrandId);
    }
    if (filterStatus === "active") {
      result = result.filter((d) => d.is_active);
    } else if (filterStatus === "inactive") {
      result = result.filter((d) => !d.is_active);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.domain.toLowerCase().includes(term) ||
          d.brands?.name.toLowerCase().includes(term)
      );
    }
    return result;
  }, [domains, filterBrandId, filterStatus, searchTerm]);

  // Stats
  const totalDomains = domains.length;
  const activeDomains = domains.filter((d) => d.is_active).length;
  const primaryDomains = domains.filter((d) => d.is_primary).length;
  const brandsComDominio = new Set(domains.map((d) => d.brand_id)).size;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      const payload = {
        domain: cleanDomain,
        brand_id: brandId,
        is_primary: isPrimary,
        is_active: isActive,
        subdomain: subdomain.trim() || null,
      };
      if (editingDomain) {
        const { error } = await supabase.from("brand_domains").update(payload).eq("id", editingDomain.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_domains").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-domains-root"] });
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
      queryClient.invalidateQueries({ queryKey: ["brand-domains-root"] });
      toast.success("Domínio removido!");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("brand_domains").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-domains-root"] });
      toast.success("Status atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditingDomain(null);
    setDomain("");
    setBrandId("");
    setIsPrimary(false);
    setIsActive(true);
    setSubdomain("");
    setDialogOpen(true);
  };

  const openEdit = (d: DomainRow) => {
    setEditingDomain(d);
    setDomain(d.domain);
    setBrandId(d.brand_id);
    setIsPrimary(d.is_primary);
    setIsActive(d.is_active);
    setSubdomain(d.subdomain || "");
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
    return <TelaCarregamentoInline />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Domínios — Visão Root</h2>
          <p className="text-muted-foreground">Gerencie todos os domínios white-label de todas as brands</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />Novo Domínio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Total de Domínios</p>
            <p className="text-2xl font-bold">{totalDomains}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-2xl font-bold text-green-500">{activeDomains}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Primários</p>
            <p className="text-2xl font-bold">{primaryDomains}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Brands com Domínio</p>
            <p className="text-2xl font-bold">{brandsComDominio}<span className="text-sm text-muted-foreground font-normal"> / {brands.length}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Brands without domains */}
      <CardSemDominio brands={brands} domains={domains} />

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Lista de Domínios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar domínio ou brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterBrandId} onValueChange={setFilterBrandId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domínio</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Primário</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filtered.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum domínio encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {d.domain}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">{d.brands?.name || "—"}</span>
                      {d.brands?.slug && (
                        <span className="text-muted-foreground text-xs ml-1">({d.brands.slug})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {d.subdomain || "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: d.id, active: !d.is_active })}
                        className="cursor-pointer"
                        title={`Clique para ${d.is_active ? "desativar" : "ativar"}`}
                      >
                        <Badge variant={d.is_active ? "default" : "destructive"} className="gap-1 cursor-pointer">
                          {d.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {d.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.is_primary ? "default" : "outline"}>
                        {d.is_primary ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
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
                placeholder="app.minhammarca.com.br"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Subdomain (slug interno)</Label>
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="ubiz-car"
              />
              <p className="text-xs text-muted-foreground">Usado para resolução via *.valeresgate.com</p>
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} {!b.is_active && "(inativa)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
                <Label>Primário</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Ativo</Label>
              </div>
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
