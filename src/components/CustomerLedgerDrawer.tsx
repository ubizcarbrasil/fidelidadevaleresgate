import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Coins, TrendingUp, TrendingDown, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const PAGE_SIZE = 20;

interface CustomerLedgerDrawerProps {
  customer: { id: string; name: string; points_balance: number; money_balance: number } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomerLedgerDrawer({ customer, open, onOpenChange }: CustomerLedgerDrawerProps) {
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["customer-ledger", customer?.id, page, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("points_ledger")
        .select("*, branches(name)", { count: "exact" })
        .eq("customer_id", customer!.id)
        .order("created_at", { ascending: false });

      if (dateRange?.from) query = query.gte("created_at", dateRange.from.toISOString());
      if (dateRange?.to) {
        const end = new Date(dateRange.to);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }

      const from = (page - 1) * PAGE_SIZE;
      const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: data, total: count || 0 };
    },
    enabled: !!customer?.id && open,
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

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

            {/* Date range filter */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal flex-1", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span>{format(dateRange.from, "dd/MM/yy")} — {format(dateRange.to, "dd/MM/yy")}</span>
                      ) : (
                        format(dateRange.from, "dd/MM/yy")
                      )
                    ) : (
                      <span>Filtrar por período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateChange}
                    numberOfMonths={1}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {dateRange && (
                <Button variant="ghost" size="sm" onClick={() => handleDateChange(undefined)} className="text-xs text-muted-foreground">
                  Limpar
                </Button>
              )}
            </div>

            <Separator />

            {/* Ledger list */}
            <ScrollArea className="h-[calc(100vh-340px)]">
              {isLoading && <p className="text-center text-muted-foreground py-8">Carregando...</p>}
              {!isLoading && (!data?.items || data.items.length === 0) && (
                <p className="text-center text-muted-foreground py-8">Nenhuma movimentação encontrada</p>
              )}
              <div className="space-y-2 pr-3">
                {data?.items?.map((e: any) => {
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">{data?.total} registros</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs px-2">{page}/{totalPages}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
