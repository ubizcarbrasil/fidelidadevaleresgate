import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { runMirrorDiagnose } from "@/lib/api/mirrorSync";
import { Search, Activity, AlertTriangle, CheckCircle, Loader2, Database } from "lucide-react";

interface Props {
  brandId: string;
  refreshKey: number;
}

function StatBox({ label, value, highlight, error }: { label: string; value: number | string; highlight?: boolean; error?: boolean }) {
  return (
    <div className={`rounded-lg border p-2 text-center ${highlight ? "border-primary bg-primary/5" : error ? "border-destructive bg-destructive/5" : ""}`}>
      <div className={`text-lg font-bold ${highlight ? "text-primary" : error && Number(value) > 0 ? "text-destructive" : ""}`}>
        {value ?? "—"}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

export default function MirrorSyncDebug({ brandId, refreshKey }: Props) {
  const [diagnoseResult, setDiagnoseResult] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null);

  const { data: lastLog } = useQuery({
    queryKey: ["mirror-debug-log", brandId, refreshKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("mirror_sync_logs")
        .select("*")
        .eq("brand_id", brandId)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
  });

  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    setDiagnoseError(null);
    setDiagnoseResult(null);
    try {
      const result = await runMirrorDiagnose(brandId);
      setDiagnoseResult(result);
    } catch (e: any) {
      setDiagnoseError(e.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const details = diagnoseResult || (lastLog?.details as any);

  return (
    <div className="space-y-4">
      {/* Diagnose Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4" />
            Diagnóstico de Cobertura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Consulta a API do Divulgador Inteligente sem salvar no banco. Mostra quantos produtos existem, quantos já estão no banco e quantos são novos.
          </p>
          <Button onClick={handleDiagnose} disabled={isDiagnosing} size="sm">
            {isDiagnosing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Executando diagnóstico...
              </>
            ) : (
              "Executar diagnóstico"
            )}
          </Button>
          {diagnoseError && (
            <div className="bg-destructive/10 rounded p-2 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              {diagnoseError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnose Result — API info */}
      {diagnoseResult?.api && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Resultado da API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="Produtos na API" value={diagnoseResult.api.total_products} highlight />
              <StatBox label="Tempo (ms)" value={diagnoseResult.api.duration_ms} />
              <StatBox label="Já no banco" value={diagnoseResult.discovery?.already_in_db ?? "—"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Novos para importar" value={diagnoseResult.discovery?.new_to_import ?? "—"} highlight />
              <StatBox label="Total no banco" value={diagnoseResult.discovery?.existing_in_db_total ?? "—"} />
            </div>

            {/* Sellers breakdown */}
            {diagnoseResult.api.sellers && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Lojas encontradas:</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(diagnoseResult.api.sellers).map(([seller, count]) => (
                    <Badge key={seller} variant="secondary" className="text-[10px]">
                      {seller}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diagnose Result — Sample products */}
      {diagnoseResult?.sample_products?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Amostra de Produtos ({diagnoseResult.sample_products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {diagnoseResult.sample_products.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  {p.is_new ? (
                    <Badge variant="default" className="text-[8px] px-1">NOVO</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[8px] px-1">JÁ EXISTE</Badge>
                  )}
                  <span className="truncate flex-1">{p.title}</span>
                  <span className="text-muted-foreground shrink-0">{p.seller}</span>
                  <span className="text-muted-foreground shrink-0">{p.price || "—"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New products sample */}
      {diagnoseResult?.new_products_sample?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Novos Produtos (amostra)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-[10px]">
              {diagnoseResult.new_products_sample.map((p: any, i: number) => (
                <li key={i} className="truncate text-muted-foreground">
                  <span className="text-foreground font-medium">{p.title}</span>
                  {" — "}{p.seller} — {p.uuid}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Last sync log details */}
      {details?.totals && !diagnoseResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Último Resultado de Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatBox label="Lidos" value={details.totals.total_read} />
              <StatBox label="Novos" value={details.totals.persisted_new} highlight />
              <StatBox label="Atualizados" value={details.totals.updated} />
              <StatBox label="Ignorados" value={details.totals.skipped} />
              <StatBox label="Erros" value={details.totals.errors} error />
            </div>

            {details.api && (
              <div className="mt-3 text-xs text-muted-foreground">
                API: {details.api.total_products} produtos em {details.api.duration_ms}ms
              </div>
            )}

            {details.samples?.length > 0 && (
              <details className="text-xs mt-3">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Amostras ({details.samples.length})
                </summary>
                <div className="mt-1 space-y-1">
                  {details.samples.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      {s.action === "created" ? (
                        <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                      ) : s.action === "error" ? (
                        <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                      ) : (
                        <CheckCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <Badge variant={s.action === "created" ? "default" : s.action === "error" ? "destructive" : "secondary"} className="text-[8px]">
                        {s.action}
                      </Badge>
                      <span className="truncate">{s.title || s.slug}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
