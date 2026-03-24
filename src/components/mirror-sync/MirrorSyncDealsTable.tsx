import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Star, Zap, ExternalLink, ToggleLeft, ToggleRight, Copy, FolderSync, ImagePlus } from "lucide-react";
import AiBannerDialog from "./AiBannerDialog";
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
import { fetchMirroredDeals, updateDealField, batchUpdateDeals, fetchCategories, duplicateDealToCategory } from "@/lib/api/mirrorSync";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  brandId: string;
  refreshKey: number;
}

export default function MirrorSyncDealsTable({ brandId, refreshKey }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dupTarget, setDupTarget] = useState<{ dealId: string; catId: string } | null>(null);

  const handleCreateBanner = (deal: any) => {
    const params = new URLSearchParams();
    if (deal.image_url) params.set("prefill_image", deal.image_url);
    if (deal.origin_url) params.set("prefill_link", deal.origin_url);
    if (deal.title) params.set("prefill_title", deal.title);
    navigate(`/banner-manager?${params.toString()}`);
  };

  const { data: deals, isLoading } = useQuery({
    queryKey: ["mirror-deals", brandId, refreshKey, statusFilter, search],
    queryFn: () =>
      fetchMirroredDeals(brandId, {
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.trim() || undefined,
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ["mirror-categories", brandId],
    queryFn: () => fetchCategories(brandId),
  });

  const catMap = new Map((categories || []).map((c: any) => [c.id, c.name]));

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

  const recategorizeMutation = useMutation({
    mutationFn: async ({ dealId, categoryId }: { dealId: string; categoryId: string }) => {
      await updateDealField(dealId, { category_id: categoryId });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Categoria atualizada!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({ dealId, categoryId }: { dealId: string; categoryId: string }) => {
      await duplicateDealToCategory(dealId, categoryId);
    },
    onSuccess: () => {
      invalidate();
      setDupTarget(null);
      toast.success("Oferta duplicada!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleAll = () => {
    if (!deals) return;
    setSelected(selected.size === deals.length ? new Set() : new Set(deals.map((d: any) => d.id)));
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
      <div className={`flex gap-3 items-center ${isMobile ? "flex-col" : "flex-wrap"}`}>
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={isMobile ? "w-full" : "max-w-xs"}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={isMobile ? "w-full" : "w-40"}>
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

      {/* Content */}
      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : !deals?.length ? (
        <p className="text-center py-8 text-muted-foreground">Nenhuma oferta importada</p>
      ) : isMobile ? (
        <MobileCardList
          deals={deals}
          selected={selected}
          toggleOne={toggleOne}
          toggleField={toggleField}
          formatPrice={formatPrice}
          catMap={catMap}
          categories={categories || []}
          onRecategorize={(dealId, catId) => recategorizeMutation.mutate({ dealId, categoryId: catId })}
          onDuplicate={(dealId, catId) => duplicateMutation.mutate({ dealId, categoryId: catId })}
          onCreateBanner={handleCreateBanner}
        />
      ) : (
        <DesktopTable
          deals={deals}
          selected={selected}
          toggleAll={toggleAll}
          toggleOne={toggleOne}
          toggleField={toggleField}
          formatPrice={formatPrice}
          catMap={catMap}
          categories={categories || []}
          onRecategorize={(dealId, catId) => recategorizeMutation.mutate({ dealId, categoryId: catId })}
          onDuplicate={(dealId, catId) => duplicateMutation.mutate({ dealId, categoryId: catId })}
          onCreateBanner={handleCreateBanner}
        />
      )}
    </div>
  );
}

/* ─── Desktop Table ─── */
interface TableProps {
  deals: any[];
  selected: Set<string>;
  toggleAll?: () => void;
  toggleOne: (id: string) => void;
  toggleField: (id: string, field: string, current: boolean) => void;
  formatPrice: (val: number | null) => string;
  catMap: Map<string, string>;
  categories: any[];
  onRecategorize: (dealId: string, catId: string) => void;
  onDuplicate: (dealId: string, catId: string) => void;
  onCreateBanner: (deal: any) => void;
}

function DesktopTable({ deals, selected, toggleAll, toggleOne, toggleField, formatPrice, catMap, categories, onRecategorize, onDuplicate, onCreateBanner }: TableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={deals.length ? selected.size === deals.length : false} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead className="w-16">Img</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Visível</TableHead>
            <TableHead>Destaque</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal: any) => (
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
                <Select value={deal.category_id || ""} onValueChange={(v) => onRecategorize(deal.id, v)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="Sem cat." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
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
                  {deal.visible_driver ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </button>
              </TableCell>
              <TableCell>
                <button onClick={() => toggleField(deal.id, "is_featured", deal.is_featured)}>
                  <Star className={`h-4 w-4 ${deal.is_featured ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                </button>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <DuplicateButton dealId={deal.id} categories={categories} onDuplicate={onDuplicate} />
                  <button onClick={() => onCreateBanner(deal)} className="p-1.5 rounded-md border" title="Criar Banner">
                    <ImagePlus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                  {deal.origin_url && (
                    <a href={deal.origin_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── Mobile Card List ─── */
function MobileCardList({ deals, selected, toggleOne, toggleField, formatPrice, catMap, categories, onRecategorize, onDuplicate, onCreateBanner }: Omit<TableProps, "toggleAll">) {
  return (
    <div className="space-y-3">
      {deals.map((deal: any) => (
        <div key={deal.id} className="rounded-lg border bg-card p-3 space-y-2">
          <div className="flex gap-3">
            <Checkbox checked={selected.has(deal.id)} onCheckedChange={() => toggleOne(deal.id)} className="mt-1" />
            {deal.image_url ? (
              <img src={deal.image_url} alt="" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{deal.title}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-sm font-bold">{formatPrice(deal.price)}</span>
                {deal.original_price && (
                  <span className="text-xs text-muted-foreground line-through">{formatPrice(deal.original_price)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={deal.is_active ? "default" : "secondary"} className="text-[10px]">
              {deal.is_active ? "Ativo" : "Inativo"}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{catMap.get(deal.category_id) || "Sem categoria"}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={deal.category_id || ""} onValueChange={(v) => onRecategorize(deal.id, v)}>
              <SelectTrigger className="h-7 text-[10px] w-auto min-w-[100px]">
                <FolderSync className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Recategorizar" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button onClick={() => toggleField(deal.id, "visible_driver", deal.visible_driver)} className="p-1.5 rounded-md border">
              {deal.visible_driver ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            <button onClick={() => toggleField(deal.id, "is_featured", deal.is_featured)} className="p-1.5 rounded-md border">
              <Star className={`h-3.5 w-3.5 ${deal.is_featured ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
            </button>
            <DuplicateButton dealId={deal.id} categories={categories} onDuplicate={onDuplicate} />
            <button onClick={() => onCreateBanner(deal)} className="p-1.5 rounded-md border" title="Criar Banner">
              <ImagePlus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
            {deal.origin_url && (
              <a href={deal.origin_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md border">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Duplicate Button with Category Picker ─── */
function DuplicateButton({ dealId, categories, onDuplicate }: { dealId: string; categories: any[]; onDuplicate: (dealId: string, catId: string) => void }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <Select onValueChange={(v) => { onDuplicate(dealId, v); setOpen(false); }}>
        <SelectTrigger className="h-7 text-[10px] w-auto min-w-[90px]">
          <Copy className="h-3 w-3 mr-1" />
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c: any) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <button onClick={() => setOpen(true)} className="p-1.5 rounded-md border" title="Duplicar para outra categoria">
      <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
    </button>
  );
}
