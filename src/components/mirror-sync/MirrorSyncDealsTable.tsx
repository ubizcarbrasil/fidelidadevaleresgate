import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Star, Zap, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { fetchMirroredDeals, updateDealField, batchUpdateDeals } from "@/lib/api/mirrorSync";

interface Props {
  brandId: string;
  refreshKey: number;
}

export default function MirrorSyncDealsTable({ brandId, refreshKey }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: deals, isLoading } = useQuery({
    queryKey: ["mirror-deals", brandId, refreshKey, statusFilter, search],
    queryFn: () =>
      fetchMirroredDeals(brandId, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.trim() || undefined,
      }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["mirror-deals"] });
    queryClient.invalidateQueries({ queryKey: ["mirror-deals-kpis"] });
  };

  const toggleField = async (id: string, field: string, current: boolean) => {
    try {
      await updateDealField(id, { [field]: !current });
      invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBatch = async (fields: Record<string, any>) => {
    if (!selected.size) return toast.error("Selecione ao menos uma oferta");
    try {
      await batchUpdateDeals([...selected], fields);
      setSelected(new Set());
      invalidate();
      toast.success("Ofertas atualizadas!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleAll = () => {
    if (!deals) return;
    if (selected.size === deals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(deals.map((d: any) => d.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const formatPrice = (val: number | null) =>
    val != null ? Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{selected.size} selecionados</Badge>
          <Button size="sm" variant="outline" onClick={() => handleBatch({ is_active: true })}>
            <ToggleRight className="h-3 w-3 mr-1" /> Ativar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBatch({ is_active: false })}>
            <ToggleLeft className="h-3 w-3 mr-1" /> Desativar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBatch({ visible_driver: true })}>
            <Eye className="h-3 w-3 mr-1" /> Mostrar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBatch({ visible_driver: false })}>
            <EyeOff className="h-3 w-3 mr-1" /> Ocultar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBatch({ is_featured: true })}>
            <Star className="h-3 w-3 mr-1" /> Destacar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBatch({ is_flash_promo: true })}>
            <Zap className="h-3 w-3 mr-1" /> Relâmpago
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={deals?.length ? selected.size === deals.length : false} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="w-16">Img</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visível</TableHead>
              <TableHead>Destaque</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : !deals?.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhuma oferta importada
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal: any) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Checkbox checked={selected.has(deal.id)} onCheckedChange={() => toggleOne(deal.id)} />
                  </TableCell>
                  <TableCell>
                    {deal.image_url ? (
                      <img src={deal.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium">{deal.title}</TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold">{formatPrice(deal.price)}</div>
                    {deal.original_price && (
                      <div className="text-xs text-muted-foreground line-through">{formatPrice(deal.original_price)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={deal.is_active ? "default" : "secondary"}>
                      {deal.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleField(deal.id, "visible_driver", deal.visible_driver)}>
                      {deal.visible_driver ? (
                        <Eye className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleField(deal.id, "is_featured", deal.is_featured)}>
                      <Star className={`h-4 w-4 ${deal.is_featured ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {deal.first_imported_at
                      ? new Date(deal.first_imported_at).toLocaleDateString("pt-BR")
                      : new Date(deal.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {deal.origin_url && (
                      <a href={deal.origin_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
