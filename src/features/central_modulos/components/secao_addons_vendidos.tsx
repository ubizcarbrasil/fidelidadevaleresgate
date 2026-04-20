/**
 * SecaoAddonsVendidos — Sub-fase 6.1
 * Lista todos os add-ons concedidos a marcas, com filtros e ações.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Ban, Trash2 } from "lucide-react";
import {
  useBusinessModelAddons,
  useCancelBusinessModelAddon,
  useDeleteBusinessModelAddon,
  type BusinessModelAddonRow,
} from "@/compartilhados/hooks/hook_business_model_addons";
import { DialogConcederAddon } from "./dialog_conceder_addon";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  cancelled: "Cancelado",
  past_due: "Inadimplente",
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function SecaoAddonsVendidos() {
  const { data, isLoading } = useBusinessModelAddons();
  const cancel = useCancelBusinessModelAddon();
  const del = useDeleteBusinessModelAddon();

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");
  const [audienceFiltro, setAudienceFiltro] = useState<string>("all");
  const [scopeFiltro, setScopeFiltro] = useState<string>("all");
  const [grantOpen, setGrantOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<BusinessModelAddonRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BusinessModelAddonRow | null>(null);

  const filtered = useMemo(() => {
    return (data ?? []).filter((a) => {
      if (statusFiltro !== "all" && a.status !== statusFiltro) return false;
      if (audienceFiltro !== "all" && a.model_audience !== audienceFiltro) return false;
      if (scopeFiltro === "brand" && a.branch_id) return false;
      if (scopeFiltro === "branch" && !a.branch_id) return false;
      if (busca) {
        const t = busca.toLowerCase();
        if (
          !a.brand_name.toLowerCase().includes(t) &&
          !a.model_name.toLowerCase().includes(t) &&
          !a.model_key.toLowerCase().includes(t) &&
          !(a.branch_name ?? "").toLowerCase().includes(t)
        )
          return false;
      }
      return true;
    });
  }, [data, busca, statusFiltro, audienceFiltro, scopeFiltro]);

  const counts = useMemo(() => {
    const c = { active: 0, cancelled: 0, past_due: 0 };
    (data ?? []).forEach((a) => {
      c[a.status as keyof typeof c] = (c[a.status as keyof typeof c] ?? 0) + 1;
    });
    return c;
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por marca ou modelo…"
            className="pl-9"
          />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
            <SelectItem value="past_due">Inadimplente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={audienceFiltro} onValueChange={setAudienceFiltro}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas audiências</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="motorista">Motorista</SelectItem>
            <SelectItem value="b2b">B2B</SelectItem>
          </SelectContent>
        </Select>
        <Select value={scopeFiltro} onValueChange={setScopeFiltro}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos escopos</SelectItem>
            <SelectItem value="brand">Marca inteira</SelectItem>
            <SelectItem value="branch">Cidade específica</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setGrantOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Conceder Add-on
        </Button>
      </div>

      {/* Resumo */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="default">Ativos: {counts.active}</Badge>
        <Badge variant="outline">Cancelados: {counts.cancelled}</Badge>
        <Badge variant="destructive">Inadimplentes: {counts.past_due}</Badge>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum add-on encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ativado</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{a.brand_name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          plano {a.subscription_plan}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {a.model_audience}
                          </Badge>
                          <span className="text-sm">{a.model_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.billing_cycle === "yearly" ? "Anual" : "Mensal"}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {formatBRL(a.price_cents)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "active"
                              ? "default"
                              : a.status === "past_due"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {STATUS_LABEL[a.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(a.activated_at)}</TableCell>
                      <TableCell className="text-xs">{formatDate(a.expires_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {a.status === "active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => setConfirmCancel(a)}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-destructive"
                            onClick={() => setConfirmDelete(a)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogConcederAddon open={grantOpen} onOpenChange={setGrantOpen} />

      <AlertDialog
        open={!!confirmCancel}
        onOpenChange={(v) => !v && setConfirmCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar add-on?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCancel
                ? `Marca "${confirmCancel.brand_name}" perderá o acesso a "${confirmCancel.model_name}" assim que o cache expirar.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCancel)
                  cancel.mutate({ id: confirmCancel.id, brand_id: confirmCancel.brand_id });
                setConfirmCancel(null);
              }}
            >
              Cancelar add-on
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação apaga o histórico do add-on. Para apenas suspender, use Cancelar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete)
                  del.mutate({ id: confirmDelete.id, brand_id: confirmDelete.brand_id });
                setConfirmDelete(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
