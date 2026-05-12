import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Gift, AlertTriangle, RefreshCw } from "lucide-react";

type JanelaKey = "24h" | "7d" | "15d" | "30d";

const JANELAS: { key: JanelaKey; label: string; descricao: string }[] = [
  { key: "24h", label: "24 horas", descricao: "Recorde nas últimas 24h" },
  { key: "7d", label: "7 dias", descricao: "Recorde nos últimos 7 dias" },
  { key: "15d", label: "15 dias", descricao: "Recorde nos últimos 15 dias" },
  { key: "30d", label: "30 dias", descricao: "Recorde nos últimos 30 dias" },
];

interface LinhaPremio {
  window_key: JanelaKey;
  enabled: boolean;
  label: string;
}

interface Props {
  seasonId: string;
}

export default function SecaoPremiosArtilharia({ seasonId }: Props) {
  const qc = useQueryClient();
  const [linhas, setLinhas] = useState<LinhaPremio[]>(
    JANELAS.map((j) => ({ window_key: j.key, enabled: false, label: "" })),
  );
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["duelo-artilharia-window-prizes", seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duelo_artilharia_window_prizes")
        .select("window_key, enabled, label")
        .eq("season_id", seasonId);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!data) return;
    setLinhas(
      JANELAS.map((j) => {
        const existente = data.find(
          (r: any) => r.window_key === j.key,
        );
        return {
          window_key: j.key,
          enabled: !!existente?.enabled,
          label: existente?.label ?? "",
        };
      }),
    );
  }, [data]);

  function atualizar(idx: number, patch: Partial<LinhaPremio>) {
    setLinhas((l) => l.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  async function salvar() {
    setSalvando(true);
    try {
      const rows = linhas.map((l) => ({
        season_id: seasonId,
        window_key: l.window_key,
        enabled: l.enabled,
        label: l.label.trim() || null,
      }));
      const { data: ups, error } = await supabase
        .from("duelo_artilharia_window_prizes")
        .upsert(rows, { onConflict: "season_id,window_key" })
        .select();
      if (error) throw error;
      if (!ups || ups.length === 0) {
        toast.error("Nada foi salvo — verifique suas permissões.");
        return;
      }
      toast.success("Prêmios da artilharia salvos");
      qc.invalidateQueries({
        queryKey: ["duelo-artilharia-window-prizes", seasonId],
      });
      qc.invalidateQueries({ queryKey: ["campeonato-artilharia", seasonId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">Prêmios da Artilharia</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Habilite o prêmio em cada janela de tempo do ranking de recordes e
          defina o título exibido no badge (ex.: "R$ 500", "Vale-combustível").
          O prêmio é entregue ao 1º colocado da janela.
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {linhas.map((l, idx) => {
                const meta = JANELAS[idx];
                return (
                  <div
                    key={l.window_key}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="flex items-center gap-3 sm:w-44">
                      <Switch
                        checked={l.enabled}
                        onCheckedChange={(v) =>
                          atualizar(idx, { enabled: !!v })
                        }
                        aria-label={`Habilitar prêmio ${meta.label}`}
                      />
                      <div>
                        <p className="text-sm font-semibold leading-tight">
                          {meta.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          {meta.descricao}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        maxLength={60}
                        placeholder="Título do prêmio (ex.: R$ 500)"
                        value={l.label}
                        onChange={(e) =>
                          atualizar(idx, { label: e.target.value })
                        }
                        disabled={!l.enabled}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={salvar} disabled={salvando}>
                {salvando && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                Salvar prêmios da artilharia
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}