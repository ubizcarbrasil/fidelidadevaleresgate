import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import {
  POSICOES_PREMIAVEIS,
  ROTULOS_POSICAO_PREMIO,
} from "../../constants/constantes_templates";
import type { FormCriarTemporadaInput } from "../../schemas/schema_criar_temporada";
import LabelComAjuda from "./LabelComAjuda";

const AJUDA_POR_POSICAO: Record<string, string> = {
  champion: "Pontos creditados ao motorista campeão da série (1º lugar do mata-mata).",
  runner_up: "Pontos para o vice-campeão (perde a final).",
  semifinal: "Pontos para os 2 motoristas eliminados na semifinal.",
  quarter: "Pontos para os 4 motoristas eliminados nas quartas de final.",
  round_of_16: "Pontos para os 8 motoristas eliminados nas oitavas de final.",
};

export default function EditorPremios() {
  const form = useFormContext<FormCriarTemporadaInput>();
  const series = useWatch({ control: form.control, name: "series" });
  const prizesPerTier = useWatch({
    control: form.control,
    name: "prizesPerTier",
  });

  // Sincroniza prizesPerTier com séries: se aparece nova série, cria default;
  // se some, remove.
  useEffect(() => {
    if (!series) return;
    const nomesAtuais = series.map((s) => s.name.trim()).filter(Boolean);
    const tiersExistentes = new Set(
      (prizesPerTier ?? []).map((p) => p.tier_name),
    );
    let mudou = false;
    const novo = [...(prizesPerTier ?? [])];
    nomesAtuais.forEach((nome) => {
      if (!tiersExistentes.has(nome)) {
        novo.push({
          tier_name: nome,
          prizes: POSICOES_PREMIAVEIS.map((p) => ({ position: p, points: 0 })),
        });
        mudou = true;
      }
    });
    const filtrado = novo.filter((p) => nomesAtuais.includes(p.tier_name));
    if (filtrado.length !== novo.length) mudou = true;
    if (mudou) form.setValue("prizesPerTier", filtrado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(series?.map((s) => s.name))]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Defina os prêmios em pontos por posição final em cada série. Pontos são
        creditados ao motorista no encerramento da temporada.
      </p>

      <div className="space-y-3">
        {(prizesPerTier ?? []).map((tier, tierIdx) => (
          <div
            key={tier.tier_name}
            className="rounded-md border border-border bg-muted/20 p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <Badge variant="outline">Série {tier.tier_name}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {POSICOES_PREMIAVEIS.map((pos, posIdx) => (
                <div key={pos} className="space-y-1">
                  <LabelComAjuda
                    ajuda={
                      AJUDA_POR_POSICAO[pos] ??
                      "Pontos creditados ao motorista que terminar nesta posição."
                    }
                  >
                    {ROTULOS_POSICAO_PREMIO[pos]}
                  </LabelComAjuda>
                  <Input
                    type="number"
                    min={0}
                    {...form.register(
                      `prizesPerTier.${tierIdx}.prizes.${posIdx}.points`,
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
