import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  brandId: string;
  refreshKey: number;
}

export default function MirrorSyncDebug({ brandId, refreshKey }: Props) {
  const { data: debugDeals, isLoading } = useQuery({
    queryKey: ["mirror-debug", brandId, refreshKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_deals")
        .select("id, title, price, origin_hash, origin_external_id, sync_status, sync_error, raw_payload, created_at")
        .eq("brand_id", brandId)
        .eq("origin", "divulgador_inteligente")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  if (isLoading) return <p className="text-muted-foreground p-4">Carregando...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Inspeção de Ofertas Importadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!debugDeals?.length ? (
            <p className="text-muted-foreground text-sm">Nenhuma oferta com dados de debug. Ative o modo debug nas configurações.</p>
          ) : (
            debugDeals.map((deal: any) => (
              <div key={deal.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate flex-1">{deal.title}</span>
                  <Badge variant={deal.sync_status === "synced" ? "default" : "destructive"}>
                    {deal.sync_status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Hash:</span> {deal.origin_hash || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Slug:</span> {deal.origin_external_id || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Preço:</span> {deal.price ?? "—"}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span> {new Date(deal.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>

                {deal.sync_error && (
                  <div className="bg-destructive/10 rounded p-2 text-xs text-destructive">
                    <span className="font-medium">Erro:</span> {deal.sync_error}
                  </div>
                )}

                {deal.raw_payload && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Ver payload bruto
                    </summary>
                    <pre className="mt-1 bg-muted p-2 rounded overflow-auto max-h-40 text-[10px]">
                      {JSON.stringify(deal.raw_payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
