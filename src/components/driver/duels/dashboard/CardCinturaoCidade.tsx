/**
 * Card compacto do cinturão — visual dourado de conquista.
 */
import { Crown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
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
  const inicial = nome.charAt(0).toUpperCase();

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="rounded-2xl p-3.5 flex flex-col cursor-pointer relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--warning) / 0.08) 100%)",
        border: "1px solid hsl(var(--warning) / 0.25)",
      }}
      onClick={onAbrir}
    >
      {/* Golden glow */}
      <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full blur-xl opacity-15" style={{ backgroundColor: "hsl(var(--warning))" }} />

      <div className="flex items-center gap-1.5 mb-2.5 relative z-10">
        <Crown className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} />
        <span className="text-[11px] font-extrabold text-foreground tracking-tight" style={{ fontFamily: fontHeading }}>
          Cinturão
        </span>
      </div>

      <div className="flex items-center gap-2 flex-1 relative z-10">
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-black shrink-0"
          style={{
            background: "linear-gradient(135deg, hsl(var(--warning)), hsl(var(--warning) / 0.6))",
            color: "hsl(var(--warning-foreground, 0 0% 10%))",
            boxShadow: "0 2px 12px hsl(var(--warning) / 0.3)",
          }}
        >
          {inicial}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground truncate">{nome}</p>
          <p className="text-[9px] text-muted-foreground">
            <b className="font-bold" style={{ color: "hsl(var(--warning))" }}>{mensal.record_value}</b> corridas
          </p>
        </div>
      </div>

      <div className="mt-2 pt-1.5 relative z-10">
        <span className="text-[9px] font-medium flex items-center gap-0.5" style={{ color: "hsl(var(--warning))" }}>
          Ver campeões <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </motion.div>
  );
}
