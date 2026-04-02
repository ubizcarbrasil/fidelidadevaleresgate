/**
 * Histórico de resgates na cidade para o motorista.
 * Exibe PINs ativos, usados e expirados.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, CheckCircle2, Clock, Copy, Loader2, ArrowLeft, Store } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ResgateNaCidade {
  id: string;
  token: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  offer_title: string;
  store_name: string;
  store_logo_url: string;
  value_rescue: number;
  min_purchase: number;
}

interface Props {
  fontHeading?: string;
  onBack: () => void;
}

export default function DriverCityRedemptionHistory({ fontHeading, onBack }: Props) {
  const { driver } = useDriverSession();

  const { data: resgates, isLoading } = useQuery({
    queryKey: ["driver-city-redemptions", driver?.id],
    queryFn: async () => {
      if (!driver?.id) return [];
      const { data, error } = await supabase.rpc("rpc_get_driver_city_redemptions", {
        p_customer_id: driver.id,
      });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!driver?.id,
    refetchInterval: 15000,
  });

  const pending = (resgates || []).filter((r: ResgateNaCidade) => r.status === "PENDING");
  const used = (resgates || []).filter((r: ResgateNaCidade) => r.status === "USED");
  const expired = (resgates || []).filter((r: ResgateNaCidade) => r.status === "EXPIRED");

  const copiarPin = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("PIN copiado!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 rounded-xl flex items-center justify-center bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
          Meus Resgates na Cidade
        </h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : !resgates?.length ? (
          <div className="text-center py-12">
            <Ticket className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum resgate na cidade ainda</p>
          </div>
        ) : (
          <>
            {/* Pendentes */}
            {pending.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-warning">
                  <Ticket className="h-4 w-4" /> Aguardando Baixa
                  <Badge className="bg-warning/15 text-warning border-0 text-xs">{pending.length}</Badge>
                </h2>
                {pending.map((r: ResgateNaCidade) => {
                  const timeLeft = r.expires_at
                    ? Math.max(0, Math.floor((new Date(r.expires_at).getTime() - Date.now()) / (1000 * 60)))
                    : null;
                  return (
                    <Card key={r.id} className="rounded-2xl border-warning/20 bg-warning/5">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          {r.store_logo_url ? (
                            <img src={r.store_logo_url} alt="" className="h-10 w-10 rounded-xl object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                              <Store className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{r.offer_title}</p>
                            <p className="text-xs text-muted-foreground">{r.store_name}</p>
                          </div>
                          <p className="text-sm font-bold text-primary">R$ {Number(r.value_rescue).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-2xl font-bold tracking-[0.2em] text-foreground">
                              {r.token}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copiarPin(r.token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          {timeLeft !== null && (
                            <span className="text-xs text-warning flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeLeft > 60 ? `${Math.floor(timeLeft / 60)}h${timeLeft % 60}m` : `${timeLeft}min`}
                            </span>
                          )}
                        </div>
                        {r.min_purchase > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Compra mínima: R$ {Number(r.min_purchase).toFixed(2)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Usados */}
            {used.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" /> Utilizados
                  <Badge className="bg-success/15 text-success border-0 text-xs">{used.length}</Badge>
                </h2>
                {used.map((r: ResgateNaCidade) => (
                  <Card key={r.id} className="rounded-2xl opacity-70">
                    <CardContent className="p-3 flex items-center gap-3">
                      {r.store_logo_url ? (
                        <img src={r.store_logo_url} alt="" className="h-9 w-9 rounded-xl object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                          <Store className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{r.offer_title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.used_at ? format(new Date(r.used_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-success">R$ {Number(r.value_rescue).toFixed(2)}</p>
                        <Badge variant="secondary" className="text-[10px]">Usado</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Expirados */}
            {expired.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Expirados
                  <Badge className="bg-muted text-muted-foreground border-0 text-xs">{expired.length}</Badge>
                </h2>
                {expired.map((r: ResgateNaCidade) => (
                  <Card key={r.id} className="rounded-2xl opacity-50">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{r.offer_title}</p>
                        <p className="text-xs text-muted-foreground">{r.store_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">R$ {Number(r.value_rescue).toFixed(2)}</p>
                        <Badge variant="destructive" className="text-[10px]">Expirado</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
