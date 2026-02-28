import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface CustomerLedgerDrawerProps {
  customer: { id: string; name: string; points_balance: number; money_balance: number } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomerLedgerDrawer({ customer, open, onOpenChange }: CustomerLedgerDrawerProps) {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["customer-ledger", customer?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("points_ledger")
        .select("*, branches(name)")
        .eq("customer_id", customer!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!customer?.id && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Extrato — {customer?.name}
          </SheetTitle>
        </SheetHeader>

        {customer && (
          <div className="mt-4 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Pontos</p>
                <p className="text-xl font-bold font-mono">{customer.points_balance}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Saldo R$</p>
                <p className="text-xl font-bold font-mono">R$ {Number(customer.money_balance).toFixed(2)}</p>
              </div>
            </div>

            <Separator />

            {/* Ledger list */}
            <ScrollArea className="h-[calc(100vh-260px)]">
              {isLoading && <p className="text-center text-muted-foreground py-8">Carregando...</p>}
              {!isLoading && (!entries || entries.length === 0) && (
                <p className="text-center text-muted-foreground py-8">Nenhuma movimentação encontrada</p>
              )}
              <div className="space-y-2 pr-3">
                {entries?.map((e: any) => {
                  const isCredit = e.entry_type === "CREDIT";
                  return (
                    <div key={e.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className={`mt-0.5 rounded-full p-1.5 ${isCredit ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {isCredit ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-mono text-sm font-semibold ${isCredit ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                            {isCredit ? "+" : "-"}{e.points_amount} pts
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(e.created_at), "dd/MM/yy HH:mm")}
                          </span>
                        </div>
                        {e.reason && <p className="text-xs text-muted-foreground truncate mt-0.5">{e.reason}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{e.reference_type}</Badge>
                          {e.branches?.name && <span className="text-[10px] text-muted-foreground">{e.branches.name}</span>}
                          <span className="text-[10px] font-mono text-muted-foreground ml-auto">R$ {Number(e.money_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
