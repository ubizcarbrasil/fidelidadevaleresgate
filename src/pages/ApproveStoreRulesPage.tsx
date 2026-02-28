import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function ApproveStoreRulesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { currentBrandId, currentBranchId, isRootAdmin } = useBrandGuard();

  const { data: rules, isLoading } = useQuery({
    queryKey: ["pending-store-rules", currentBrandId, currentBranchId],
    queryFn: async () => {
      let q = supabase
        .from("store_points_rules")
        .select("*, stores(name), branches(name)")
        .order("created_at", { ascending: false });

      if (!isRootAdmin) {
        if (currentBranchId) q = q.eq("branch_id", currentBranchId);
        else if (currentBrandId) q = q.eq("brand_id", currentBrandId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const pendingRules = rules?.filter(r => r.status === "PENDING_APPROVAL") || [];
  const otherRules = rules?.filter(r => r.status !== "PENDING_APPROVAL") || [];

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = {
        status,
        approved_by_user_id: user?.id,
        approved_at: new Date().toISOString(),
      };
      if (status === "REJECTED") {
        updates.is_active = false;
      }
      const { error } = await supabase.from("store_points_rules").update(updates).eq("id", id);
      if (error) throw error;

      // Audit log
      await supabase.from("audit_logs").insert({
        action: status === "ACTIVE" ? "APPROVE_STORE_RULE" : "REJECT_STORE_RULE",
        entity_type: "store_points_rules",
        entity_id: id,
        actor_user_id: user?.id,
        changes_json: { status },
        details_json: {},
      });
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ["pending-store-rules"] });
      toast.success(status === "ACTIVE" ? "Regra aprovada!" : "Regra rejeitada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Badge className="bg-green-600">Ativa</Badge>;
      case "PENDING_APPROVAL": return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>;
      case "REJECTED": return <Badge variant="destructive">Rejeitada</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" /> Aprovar Regras de Lojas
        </h2>
        <p className="text-muted-foreground">Gerencie as solicitações de regras personalizadas das lojas</p>
      </div>

      {/* Pending rules */}
      {pendingRules.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Pendentes ({pendingRules.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Pts/R$</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRules.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.stores?.name}</TableCell>
                    <TableCell className="text-sm">{r.branches?.name}</TableCell>
                    <TableCell className="font-mono font-bold">{Number(r.points_per_real)}</TableCell>
                    <TableCell className="text-xs">
                      {r.starts_at ? format(new Date(r.starts_at), "dd/MM/yy") : "—"}
                      {" → "}
                      {r.ends_at ? format(new Date(r.ends_at), "dd/MM/yy") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM/yy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "ACTIVE" })}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "REJECTED" })}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pendingRules.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma regra pendente de aprovação.
          </CardContent>
        </Card>
      )}

      {/* History */}
      {otherRules.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Histórico</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Pts/R$</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherRules.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.stores?.name}</TableCell>
                    <TableCell className="font-mono">{Number(r.points_per_real)}</TableCell>
                    <TableCell className="text-xs">
                      {r.starts_at ? format(new Date(r.starts_at), "dd/MM/yy") : "—"}
                      {" → "}
                      {r.ends_at ? format(new Date(r.ends_at), "dd/MM/yy") : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM/yy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
