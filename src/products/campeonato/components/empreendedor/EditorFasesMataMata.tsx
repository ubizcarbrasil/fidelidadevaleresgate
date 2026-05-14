import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Swords } from "lucide-react";
import InputNumero from "@/compartilhados/components/input_numero";

type FaseChave = "R16" | "QF" | "SF" | "Final";

const FASES: { chave: FaseChave; rotulo: string }[] = [
  { chave: "R16", rotulo: "Oitavas (R16)" },
  { chave: "QF", rotulo: "Quartas (QF)" },
  { chave: "SF", rotulo: "Semifinal (SF)" },
  { chave: "Final", rotulo: "Final" },
];

const DURACAO_PADRAO = 24;

interface Props {
  seasonId: string;
}

export default function EditorFasesMataMata({ seasonId }: Props) {
  const qc = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const [valores, setValores] = useState<Record<FaseChave, number>>({
    R16: DURACAO_PADRAO,
    QF: DURACAO_PADRAO,
    SF: DURACAO_PADRAO,
    Final: DURACAO_PADRAO,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["duelo-season-phase-config", seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campeonato_season_phase_config")
        .select("phase, duration_hours")
        .eq("season_id", seasonId);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!data) return;
    const novo: Record<FaseChave, number> = {
      R16: DURACAO_PADRAO,
      QF: DURACAO_PADRAO,
      SF: DURACAO_PADRAO,
      Final: DURACAO_PADRAO,
    };
    data.forEach((row: any) => {
      if (row.phase in novo) novo[row.phase as FaseChave] = row.duration_hours;
    });
    setValores(novo);
  }, [data]);

  async function salvar() {
    setSalvando(true);
    try {
      const rows = FASES.map((f) => ({
        season_id: seasonId,
        phase: f.chave,
        duration_hours: Math.max(1, Math.min(240, Number(valores[f.chave]) || DURACAO_PADRAO)),
      }));
      const { data: salvos, error } = await supabase
        .from("campeonato_season_phase_config")
        .upsert(rows, { onConflict: "season_id,phase" })
        .select();
      if (error) throw error;
      if (!salvos || salvos.length === 0) {
        toast.error("Não foi possível salvar — verifique suas permissões.");
        return;
      }
      toast.success("Durações das fases salvas");
      qc.invalidateQueries({ queryKey: ["duelo-season-phase-config", seasonId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar durações");
    } finally {
      setSalvando(false);
    }
  }

  const conteudo = useMemo(
    () => (
      <div className="space-y-3">
        {FASES.map((f) => (
          <div key={f.chave} className="grid grid-cols-[1fr,120px] items-center gap-3">
            <Label className="text-sm">{f.rotulo}</Label>
            <InputNumero
              defaultOnEmpty={DURACAO_PADRAO}
              value={valores[f.chave]}
              onChange={(n) =>
                setValores((v) => ({
                  ...v,
                  [f.chave]: n,
                }))
              }
            />
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">
          Defina quantas horas cada fase eliminatória dura. Valores ausentes
          assumem o padrão de {DURACAO_PADRAO}h.
        </p>
        <div className="flex justify-end">
          <Button size="sm" onClick={salvar} disabled={salvando}>
            {salvando && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Salvar durações
          </Button>
        </div>
      </div>
    ),
    [valores, salvando],
  );

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Duração das fases do mata-mata</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
          </div>
        ) : (
          conteudo
        )}
      </CardContent>
    </Card>
  );
}