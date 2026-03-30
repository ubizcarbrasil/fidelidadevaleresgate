import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUpRight, ArrowDownRight, Download, ScrollText } from "lucide-react";
import { formatPoints } from "@/lib/formatPoints";

interface Props {
  driverId: string;
  driverName: string;
}

type LedgerEntry = {
  id: string;
  entry_type: string;
  points_amount: number;
  money_amount: number | null;
  reason: string | null;
  created_at: string;
};

export default function DriverLedgerSection({ driverId, driverName }: Props) {
  const { data: ledger, isLoading, error } = useQuery({
    queryKey: ["driver-ledger-detail", driverId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("points_ledger")
        .select("id, entry_type, points_amount, money_amount, reason, created_at")
        .eq("customer_id", driverId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as LedgerEntry[];
    },
    enabled: !!driverId,
  });

  const handleExportLedger = () => {
    if (!ledger || ledger.length === 0) return;
    const header = "Data,Tipo,Pontos,Valor,Motivo";
    const rows = ledger.map((e) =>
      [
        new Date(e.created_at).toLocaleString("pt-BR"),
        e.entry_type,
        e.points_amount,
        e.money_amount ?? "",
        `"${(e.reason || "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extrato-${driverName.replace(/\s/g, "_")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <ScrollText className="h-3.5 w-3.5" />
          Extrato de Pontos
        </h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportLedger}
          disabled={!ledger || ledger.length === 0}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          CSV
        </Button>
      </div>

      <ScrollArea className="h-64">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center py-8">
            Erro ao carregar extrato. Verifique suas permissões.
          </p>
        ) : !ledger || ledger.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma movimentação encontrada
          </p>
        ) : (
          <div className="space-y-1.5">
            {ledger.map((e) => {
              const isCredit = e.entry_type === "CREDIT";
              return (
                <div
                  key={e.id}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    isCredit
                      ? "border-primary/20 bg-primary/5"
                      : "border-destructive/20 bg-destructive/5"
                  }`}
                >
                  {isCredit ? (
                    <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="truncate block text-xs">
                      {e.reason || (isCredit ? "Crédito" : "Débito")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(e.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <Badge
                    variant={isCredit ? "default" : "destructive"}
                    className="text-xs font-mono shrink-0"
                  >
                    {isCredit ? "+" : "-"}{e.points_amount}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
