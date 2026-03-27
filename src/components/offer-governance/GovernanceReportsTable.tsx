import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOfferReports, updateReportStatus, REPORT_STATUS_LABELS } from "@/lib/api/offerGovernance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle, X, Eye, AlertTriangle } from "lucide-react";

const MOTIVO_LABELS: Record<string, string> = {
  preco_diferente: "Preço diferente",
  oferta_indisponivel: "Oferta indisponível",
  link_com_erro: "Link com erro",
  produto_diferente: "Produto diferente",
  outro: "Outro",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  reviewed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
};

interface Props {
  brandId: string;
}

export default function GovernanceReportsTable({ brandId }: Props) {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["governance-reports", brandId],
    queryFn: () => fetchOfferReports(brandId),
  });

  const handleUpdateStatus = async (id: string, status: string, offerId?: string) => {
    try {
      await updateReportStatus(id, status, offerId);
      toast.success(
        status === "confirmed"
          ? "Denúncia confirmada — verificação de auto-ocultação aplicada"
          : "Status atualizado"
      );
      queryClient.invalidateQueries({ queryKey: ["governance-reports"] });
      queryClient.invalidateQueries({ queryKey: ["governance-deals"] });
      queryClient.invalidateQueries({ queryKey: ["governance-kpis"] });
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  // Count confirmed reports per offer for badge display
  const confirmedByOffer = new Map<string, number>();
  for (const r of reports || []) {
    if (r.status === "confirmed" && r.offer_id) {
      confirmedByOffer.set(r.offer_id, (confirmedByOffer.get(r.offer_id) || 0) + 1);
    }
  }

  return (
    <div className="rounded-lg border border-border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Motivo</TableHead>
            <TableHead>Observação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Alertas</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-[140px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
              </TableRow>
            ))
          ) : !reports?.length ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhuma denúncia registrada
              </TableCell>
            </TableRow>
          ) : (
            reports.map((r: any) => {
              const confirmedCount = confirmedByOffer.get(r.offer_id) || 0;
              return (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">
                    {MOTIVO_LABELS[r.reason] || r.reason}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {r.note || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[r.status] || ""}>
                      {REPORT_STATUS_LABELS[r.status] || r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {confirmedCount >= 2 && (
                      <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/30 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {confirmedCount} confirmadas
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(r.id, "confirmed", r.offer_id)} title="Confirmar">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(r.id, "dismissed")} title="Dispensar">
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(r.id, "reviewed")} title="Revisar">
                          <Eye className="h-4 w-4 text-blue-400" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
