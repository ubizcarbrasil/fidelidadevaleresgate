import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Gift,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";

type JanelaKey = "24h" | "7d" | "15d" | "30d";
type PrizeKind = "points" | "item";

const JANELAS: { key: JanelaKey; label: string; descricao: string }[] = [
  { key: "24h", label: "24 horas", descricao: "Recorde nas últimas 24h" },
  { key: "7d", label: "7 dias", descricao: "Recorde nos últimos 7 dias" },
  { key: "15d", label: "15 dias", descricao: "Recorde nos últimos 15 dias" },
  { key: "30d", label: "30 dias", descricao: "Recorde nos últimos 30 dias" },
];

interface PremioLinha {
  position: number;
  prize_kind: PrizeKind;
  prize_value: string;
  description: string;
}

type PremiosPorJanela = Record<JanelaKey, PremioLinha[]>;

interface Props {
  seasonId: string;
}

function ordenar(rows: PremioLinha[]): PremioLinha[] {
  return [...rows].sort((a, b) => a.position - b.position);
}

export default function EditorPremiosArtilharia({ seasonId }: Props) {
  const qc = useQueryClient();
  const [estado, setEstado] = useState<PremiosPorJanela>({
    "24h": [],
    "7d": [],
    "15d": [],
    "30d": [],
  });
  const [salvandoJanela, setSalvandoJanela] = useState<JanelaKey | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["campeonato-artilharia-premios", seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campeonato_artilharia_window_prizes")
        .select(
          "window_key, position, prize_kind, prize_value, description",
        )
        .eq("season_id", seasonId)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{
        window_key: JanelaKey;
        position: number;
        prize_kind: PrizeKind | null;
        prize_value: string | null;
        description: string | null;
      }>;
    },
  });

  useEffect(() => {
    if (!data) return;
    const inicial: PremiosPorJanela = { "24h": [], "7d": [], "15d": [], "30d": [] };
    for (const row of data) {
      if (!inicial[row.window_key]) continue;
      inicial[row.window_key].push({
        position: row.position,
        prize_kind: (row.prize_kind ?? "points") as PrizeKind,
        prize_value: row.prize_value ?? "",
        description: row.description ?? "",
      });
    }
    (Object.keys(inicial) as JanelaKey[]).forEach((k) => {
      inicial[k] = ordenar(inicial[k]);
    });
    setEstado(inicial);
  }, [data]);

  function adicionarLinha(janela: JanelaKey) {
    setEstado((prev) => {
      const atuais = prev[janela];
      const proxPos = atuais.length === 0 ? 1 : Math.max(...atuais.map((p) => p.position)) + 1;
      return {
        ...prev,
        [janela]: [
          ...atuais,
          {
            position: proxPos,
            prize_kind: "points",
            prize_value: "",
            description: "",
          },
        ],
      };
    });
  }

  function removerLinha(janela: JanelaKey, idx: number) {
    setEstado((prev) => ({
      ...prev,
      [janela]: prev[janela].filter((_, i) => i !== idx),
    }));
  }

  function atualizarLinha(
    janela: JanelaKey,
    idx: number,
    patch: Partial<PremioLinha>,
  ) {
    setEstado((prev) => ({
      ...prev,
      [janela]: prev[janela].map((row, i) =>
        i === idx ? { ...row, ...patch } : row,
      ),
    }));
  }

  async function salvarJanela(janela: JanelaKey) {
    setErro(null);
    setSalvandoJanela(janela);
    try {
      const linhas = estado[janela];
      // Validação rápida
      const positions = linhas.map((l) => l.position);
      const setPos = new Set(positions);
      if (setPos.size !== positions.length) {
        throw new Error("Há posições duplicadas nesta janela.");
      }
      for (const l of linhas) {
        if (!Number.isInteger(l.position) || l.position < 1 || l.position > 50) {
          throw new Error("Posição deve estar entre 1 e 50.");
        }
        if (!l.prize_value.trim() && !l.description.trim()) {
          throw new Error("Cada prêmio precisa de valor ou descrição.");
        }
      }

      // Substitui o conjunto desta janela: delete + insert (transacional do ponto de vista do usuário)
      const { error: errDel, data: deleted } = await supabase
        .from("campeonato_artilharia_window_prizes")
        .delete()
        .eq("season_id", seasonId)
        .eq("window_key", janela)
        .select();
      if (errDel) throw errDel;
      // deleted pode ser [] se nada existia — sem problema

      if (linhas.length > 0) {
        const rows = linhas.map((l) => ({
          season_id: seasonId,
          window_key: janela,
          enabled: true,
          position: l.position,
          prize_kind: l.prize_kind,
          prize_value: l.prize_value.trim() || null,
          description: l.description.trim() || null,
          // mantém label legacy = description do 1º para compat com leitores antigos
          label:
            l.position === 1
              ? l.description.trim() || l.prize_value.trim() || null
              : null,
        }));
        const { data: ins, error: errIns } = await supabase
          .from("campeonato_artilharia_window_prizes")
          .insert(rows)
          .select();
        if (errIns) throw errIns;
        if (!ins || ins.length === 0) {
          throw new Error(
            "Nada foi salvo — verifique suas permissões (RLS).",
          );
        }
      }
      void deleted;

      toast.success(`Prêmios da janela ${janela} salvos`);
      qc.invalidateQueries({
        queryKey: ["campeonato-artilharia-premios", seasonId],
      });
      qc.invalidateQueries({ queryKey: ["campeonato-artilharia", seasonId] });
    } catch (e: any) {
      const raw = e?.message ?? "";
      const isRls = /row-level security|violates.*policy|RLS/i.test(raw);
      const isNetwork = /network|fetch|offline|timeout|failed to fetch/i.test(raw);
      let msg = raw || "Erro ao salvar";
      if (isRls)
        msg =
          "Permissão negada (RLS). Verifique se você é administrador da marca.";
      else if (isNetwork)
        msg = "Erro de rede. Verifique sua conexão e tente novamente.";
      setErro(msg);
      toast.error(msg);
    } finally {
      setSalvandoJanela(null);
    }
  }

  function mensagemErroCarregamento(): string {
    const raw = (error as any)?.message ?? "";
    if (/row-level security|violates.*policy|RLS/i.test(raw)) {
      return "Você não tem permissão para visualizar estas configurações (RLS).";
    }
    if (/network|fetch|offline|timeout|failed to fetch/i.test(raw)) {
      return "Erro de rede ao carregar configurações. Verifique sua conexão.";
    }
    return raw || "Erro ao carregar configurações.";
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">Prêmios de Artilharia</h3>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-2">
          Configure múltiplos prêmios (1º, 2º, 3º…) por janela do ranking de
          recordes. O 1º prêmio é exibido como badge no topo do motorista.
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando
            prêmios...
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive leading-relaxed">
                {mensagemErroCarregamento()}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="h-7 text-xs"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {JANELAS.map((j) => {
              const linhas = estado[j.key];
              return (
                <div
                  key={j.key}
                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        {j.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {j.descricao}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => adicionarLinha(j.key)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {linhas.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic py-2">
                      Nenhum prêmio configurado para esta janela.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {linhas.map((l, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-1.5 items-center"
                        >
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={l.position}
                            onChange={(e) =>
                              atualizarLinha(j.key, idx, {
                                position: Number(e.target.value) || 1,
                              })
                            }
                            className="col-span-2 h-8 text-xs"
                            aria-label="Posição"
                          />
                          <div className="col-span-3">
                            <Select
                              value={l.prize_kind}
                              onValueChange={(v) =>
                                atualizarLinha(j.key, idx, {
                                  prize_kind: v as PrizeKind,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="points">Pontos</SelectItem>
                                <SelectItem value="item">Item</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            value={l.prize_value}
                            onChange={(e) =>
                              atualizarLinha(j.key, idx, {
                                prize_value: e.target.value,
                              })
                            }
                            placeholder="Valor"
                            className="col-span-3 h-8 text-xs"
                            aria-label="Valor"
                          />
                          <Input
                            value={l.description}
                            onChange={(e) =>
                              atualizarLinha(j.key, idx, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Descrição"
                            className="col-span-3 h-8 text-xs"
                            aria-label="Descrição"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="col-span-1 h-7 w-7 text-destructive"
                            onClick={() => removerLinha(j.key, idx)}
                            aria-label="Remover prêmio"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={() => salvarJanela(j.key)}
                      disabled={salvandoJanela === j.key}
                      className="h-7 text-xs"
                    >
                      {salvandoJanela === j.key && (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      )}
                      Salvar {j.label}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {erro && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive leading-relaxed">{erro}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
