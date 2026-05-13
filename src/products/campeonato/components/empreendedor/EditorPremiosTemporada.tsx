import { useEffect, useMemo, useState } from "react";
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
import { Loader2, Plus, Trophy, X } from "lucide-react";
import SecaoPremiosArtilharia from "./SecaoPremiosArtilharia";

interface TierResumo {
  tier_id: string;
  tier_name: string;
}

interface LinhaPremio {
  position: number;
  prize_kind: "points" | "item";
  prize_value: number;
  description: string;
}

interface Props {
  seasonId: string;
  tiers: TierResumo[];
}

export default function EditorPremiosTemporada({ seasonId, tiers }: Props) {
  const qc = useQueryClient();
  const [tierId, setTierId] = useState<string>(tiers[0]?.tier_id ?? "");
  const [linhas, setLinhas] = useState<LinhaPremio[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!tierId && tiers[0]) setTierId(tiers[0].tier_id);
  }, [tiers, tierId]);

  const { data, isLoading } = useQuery({
    queryKey: ["duelo-season-prizes", seasonId, tierId],
    enabled: !!seasonId && !!tierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duelo_season_prizes")
        .select("position, prize_kind, prize_value, description")
        .eq("season_id", seasonId)
        .eq("tier_id", tierId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!data) return;
    setLinhas(
      data.map((r: any) => ({
        position: Number(r.position) || 1,
        prize_kind: (r.prize_kind === "item" ? "item" : "points") as "points" | "item",
        prize_value: Number(r.prize_value) || 0,
        description: r.description ?? "",
      })),
    );
  }, [data]);

  function adicionar() {
    const proxPos =
      (linhas.length > 0 ? Math.max(...linhas.map((l) => l.position)) : 0) + 1;
    setLinhas((l) => [
      ...l,
      { position: proxPos, prize_kind: "points", prize_value: 0, description: "" },
    ]);
  }

  function remover(idx: number) {
    setLinhas((l) => l.filter((_, i) => i !== idx));
  }

  function atualizar(idx: number, patch: Partial<LinhaPremio>) {
    setLinhas((l) => l.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  async function salvar() {
    if (!tierId) return;
    // Valida posições únicas
    const posSet = new Set<number>();
    for (const l of linhas) {
      if (!Number.isInteger(l.position) || l.position < 1) {
        toast.error("Posição deve ser inteiro ≥ 1");
        return;
      }
      if (posSet.has(l.position)) {
        toast.error(`Posição ${l.position} duplicada — ajuste antes de salvar.`);
        return;
      }
      posSet.add(l.position);
    }
    setSalvando(true);
    try {
      // delete + insert (atômico do ponto de vista do tier)
      const { error: delErr } = await supabase
        .from("duelo_season_prizes")
        .delete()
        .eq("season_id", seasonId)
        .eq("tier_id", tierId)
        .select();
      if (delErr) throw delErr;

      if (linhas.length > 0) {
        const rows = linhas.map((l) => ({
          season_id: seasonId,
          tier_id: tierId,
          position: l.position,
          prize_kind: l.prize_kind,
          prize_value: l.prize_value,
          description: l.description?.trim() || null,
        }));
        const { data: ins, error: insErr } = await supabase
          .from("duelo_season_prizes")
          .insert(rows)
          .select();
        if (insErr) throw insErr;
        if (!ins || ins.length === 0) {
          toast.error("Nada foi salvo — verifique suas permissões.");
          return;
        }
      }
      toast.success("Prêmios salvos");
      qc.invalidateQueries({
        queryKey: ["duelo-season-prizes", seasonId, tierId],
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar prêmios");
    } finally {
      setSalvando(false);
    }
  }

  const tierAtual = useMemo(
    () => tiers.find((t) => t.tier_id === tierId),
    [tiers, tierId],
  );

  if (tiers.length === 0) return null;

  return (
    <div className="space-y-4">
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Prêmios da temporada</h3>
          </div>
          <div className="w-44">
            <Select value={tierId} onValueChange={setTierId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a série" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.tier_id} value={t.tier_id}>
                    Série {t.tier_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Defina os prêmios da série{" "}
          <strong>{tierAtual?.tier_name ?? "—"}</strong> nesta temporada.
          Substitui os prêmios padrão da marca apenas para esta temporada.
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-2 w-20">Posição</th>
                    <th className="py-2 pr-2 w-28">Tipo</th>
                    <th className="py-2 pr-2 w-28">Valor</th>
                    <th className="py-2 pr-2">Descrição</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-4 text-center text-xs text-muted-foreground"
                      >
                        Nenhum prêmio cadastrado para esta série.
                      </td>
                    </tr>
                  )}
                  {linhas.map((l, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={1}
                          value={l.position}
                          onChange={(e) =>
                            atualizar(idx, {
                              position: Number(e.target.value) || 1,
                            })
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Select
                          value={l.prize_kind}
                          onValueChange={(v) =>
                            atualizar(idx, {
                              prize_kind: v as "points" | "item",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="points">Pontos</SelectItem>
                            <SelectItem value="item">Item</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          value={l.prize_value}
                          onChange={(e) =>
                            atualizar(idx, {
                              prize_value: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="text"
                          placeholder="(opcional)"
                          value={l.description}
                          onChange={(e) =>
                            atualizar(idx, { description: e.target.value })
                          }
                        />
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => remover(idx)}
                          aria-label="Remover linha"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={adicionar}
              >
                <Plus className="mr-2 h-3.5 w-3.5" /> Adicionar posição
              </Button>
              <Button size="sm" onClick={salvar} disabled={salvando}>
                {salvando && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                Salvar prêmios
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
    <SecaoPremiosArtilharia seasonId={seasonId} />
    </div>
  );
}