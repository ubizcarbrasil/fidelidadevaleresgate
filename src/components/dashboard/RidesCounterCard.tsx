import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Car } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";

interface RidesCounterCardProps {
  brandId?: string;
}

export default function RidesCounterCard({ brandId }: RidesCounterCardProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return { from, to };
  });

  const fromDate = dateRange?.from;
  const toDate = dateRange?.to;

  const { data, isLoading } = useQuery({
    queryKey: ["rides-counter", brandId, fromDate?.toISOString(), toDate?.toISOString()],
    queryFn: async () => {
      if (!brandId || !fromDate || !toDate) return null;

      const { count, error } = await supabase
        .from("machine_rides")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", brandId)
        .eq("ride_status", "FINALIZED")
        .gte("created_at", startOfDay(fromDate).toISOString())
        .lte("created_at", endOfDay(toDate).toISOString());

      if (error) {
        console.error("Erro ao buscar corridas:", error);
        throw error;
      }

      return { total: count ?? 0 };
    },
    enabled: !!brandId && !!fromDate && !!toDate,
  });

  const label = fromDate && toDate
    ? `${format(fromDate, "dd/MM/yy", { locale: ptBR })} — ${format(toDate, "dd/MM/yy", { locale: ptBR })}`
    : "Selecione o período";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Corridas Realizadas
          </CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-xs font-normal gap-1.5",
                  !fromDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                locale={ptBR}
                disabled={(date) => date > new Date()}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-12 w-32" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">
              {(data?.total ?? 0).toLocaleString("pt-BR")}
            </span>
            <span className="text-sm text-muted-foreground">corridas</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
