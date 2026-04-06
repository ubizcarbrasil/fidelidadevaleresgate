/**
 * Card resumido do cinturão da cidade para o dashboard.
 */
import { Crown, ChevronRight } from "lucide-react";
import { type CampeaoCinturao } from "../hook_cinturao_cidade";
import { cleanDriverName } from "../hook_duelos";

interface Props {
  campeoes: CampeaoCinturao[];
  onAbrir: () => void;
  fontHeading?: string;
}

export default function CardCinturaoCidade({ campeoes, onAbrir, fontHeading }: Props) {
  const mensal = campeoes.find((c) => c.record_type === "monthly");
  if (!mensal) return null;

  const nome = cleanDriverName(mensal.champion_nickname || mensal.champion_name);

  return (
    <div
      className="rounded-2xl p-4 space-y-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--warning) / 0.05))",
        border: "1px solid hsl(var(--warning) / 0.3)",
      }}
      onClick={onAbrir}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--warning) / 0.15)" }}>
            <Crown className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
          </div>
          <span className="text-xs font-bold text-foreground" style={{ fontFamily: fontHeading }}>
            Cinturão da Cidade
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">🏆</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{nome}</p>
          <p className="text-[11px] text-muted-foreground">
            Recorde: <b className="font-bold" style={{ color: "hsl(var(--warning))" }}>{mensal.record_value}</b> corridas no mês
          </p>
        </div>
      </div>
    </div>
  );
}
