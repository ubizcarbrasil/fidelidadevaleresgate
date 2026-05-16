import { useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { formatarData } from "../../utils/utilitarios_campeonato";
import {
  ROTULOS_POSICAO_PREMIO,
} from "../../constants/constantes_templates";
import type { FormCriarTemporadaInput } from "../../schemas/schema_criar_temporada";

export default function RevisaoCriacao() {
  const form = useFormContext<FormCriarTemporadaInput>();
  const v = form.watch();

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Temporada
        </p>
        <p className="font-semibold">{v.name || "—"}</p>
        <p className="text-xs text-muted-foreground">
          Classificação {formatarData(v.classificationStartsAt)} →{" "}
          {formatarData(v.classificationEndsAt)} · Mata-mata{" "}
          {formatarData(v.knockoutStartsAt)} → {formatarData(v.knockoutEndsAt)}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Modo de pontuação
        </p>
        {v.scoringMode === "daily_matchup" ? (
          <p className="text-xs">
            <span className="font-semibold">Confronto diário</span> · V{" "}
            {v.scoringConfig?.win ?? 3} / E {v.scoringConfig?.draw ?? 1} / D{" "}
            {v.scoringConfig?.loss ?? 0}
          </p>
        ) : (
          <p className="text-xs">
            <span className="font-semibold">Pontos corridos</span> · +1 por corrida
          </p>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Séries ({v.series?.length ?? 0})
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {v.series?.map((s) => (
            <Badge key={s.name} variant="outline">
              {s.name} · {s.size} · ↑{s.promote_count} ↓{s.relegate_count}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Prêmios
        </p>
        <div className="mt-1 grid gap-1.5">
          {v.prizesPerTier?.map((t) => (
            <div
              key={t.tier_name}
              className="rounded border border-border bg-muted/20 px-2 py-1.5 text-xs"
            >
              <span className="font-medium">Série {t.tier_name}:</span>{" "}
              {t.prizes
                .map(
                  (p) =>
                    `${ROTULOS_POSICAO_PREMIO[p.position as keyof typeof ROTULOS_POSICAO_PREMIO]} ${p.points}pts`,
                )
                .join(" · ")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
