import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { runMirrorDiagnose } from "@/lib/api/mirrorSync";
import { Search, Activity, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface Props {
  brandId: string;
  refreshKey: number;
}

export default function MirrorSyncDebug({ brandId, refreshKey }: Props) {
  const [diagnoseResult, setDiagnoseResult] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null);

  // Load last sync log with details
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
            Executa uma varredura completa na origem sem salvar no banco. Mostra quantos links e ofertas foram encontrados em cada página.
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

      {/* Results */}
      {details && (
        <>
          {/* Discovery Summary */}
          {details.discovery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Resumo da Descoberta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatBox label="Links brutos" value={details.discovery.total_links_raw} />
                  <StatBox label="Links únicos" value={details.discovery.unique_links} />
                  <StatBox label="Cards parseados" value={details.discovery.unique_cards} />
                  <StatBox label="Duplicados entre páginas" value={details.discovery.duplicates_cross_page} />
                  <StatBox label="Já no banco" value={details.discovery.already_in_db} />
                  <StatBox label="Novos a importar" value={details.discovery.new_to_scrape} highlight />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-page details */}
          {details.pages && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Detalhes por Página</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {details.pages.map((page: any, i: number) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono truncate flex-1">{page.url}</span>
                      {page.error ? (
                        <Badge variant="destructive" className="text-[10px]">Erro</Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px]">OK</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div><span className="font-medium">Links:</span> {page.links_found}</div>
                      <div><span className="font-medium">Cards:</span> {page.cards_parsed}</div>
                      <div><span className="font-medium">HTML:</span> {(page.html_length / 1024).toFixed(0)}KB</div>
                      <div><span className="font-medium">Tempo:</span> {(page.duration_ms / 1000).toFixed(1)}s</div>
                    </div>
                    {page.error && (
                      <div className="text-xs text-destructive">{page.error}</div>
                    )}
                    {page.sample_titles?.length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Amostra de títulos ({page.sample_titles.length})
                        </summary>
                        <ul className="mt-1 space-y-0.5 text-[10px]">
                          {page.sample_titles.map((t: string, j: number) => (
                            <li key={j} className="truncate text-muted-foreground">• {t}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {page.sample_links?.length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Amostra de links ({page.sample_links.length})
                        </summary>
                        <ul className="mt-1 space-y-0.5 text-[10px]">
                          {page.sample_links.map((l: string, j: number) => (
                            <li key={j} className="truncate font-mono text-muted-foreground">• {l}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Phase 2 */}
          {details.phase2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Fase 2 — Scrape Individual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <StatBox label="Scrapeados" value={details.phase2.scraped} />
                  <StatBox label="Sucesso" value={details.phase2.parsed_ok} />
                  <StatBox label="Falha" value={details.phase2.parse_failed} />
                </div>
                {details.phase2.samples?.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Amostras ({details.phase2.samples.length})
                    </summary>
                    <div className="mt-1 space-y-1">
                      {details.phase2.samples.map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          {s.success ? (
                            <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                          )}
                          <span className="truncate">{s.title || s.slug}</span>
                          {s.error && <span className="text-destructive">({s.error})</span>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {/* Totals */}
          {details.totals && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resultado Final</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <StatBox label="Lidos" value={details.totals.total_read} />
                  <StatBox label="Novos" value={details.totals.persisted_new} highlight />
                  <StatBox label="Atualizados" value={details.totals.updated} />
                  <StatBox label="Ignorados" value={details.totals.skipped} />
                  <StatBox label="Erros" value={details.totals.errors} error />
                </div>
              </CardContent>
            </Card>
          )}

          {/* New links sample (diagnose mode) */}
          {diagnoseResult?.new_links_sample?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Links Novos Descobertos (amostra)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-[10px] font-mono">
                  {diagnoseResult.new_links_sample.map((l: any, i: number) => (
                    <li key={i} className="truncate text-muted-foreground">
                      <span className="text-foreground font-medium">{l.slug || "—"}</span>
                      {" → "}
                      {l.url}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
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
