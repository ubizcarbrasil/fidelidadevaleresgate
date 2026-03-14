import React from "react";
import { motion } from "framer-motion";
import { PackageOpen, Coins, Ticket, Tag } from "lucide-react";

interface EmptyStateProps {
  type?: "offers" | "points" | "redemptions" | "generic";
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  primary?: string;
}

const PRESETS = {
  offers: {
    icon: Tag,
    title: "Nenhuma oferta disponível",
    description: "Em breve novas ofertas serão publicadas pelos nossos parceiros. Fique de olho!",
  },
  points: {
    icon: Coins,
    title: "Você ainda não tem pontos",
    description: "Compre em parceiros emissores para começar a acumular pontos e trocar por recompensas!",
  },
  redemptions: {
    icon: Ticket,
    title: "Nenhum resgate ainda",
    description: "Resgate cupons e ofertas para vê-los aqui. Comece explorando as ofertas disponíveis!",
  },
  generic: {
    icon: PackageOpen,
    title: "Nada por aqui",
    description: "Não encontramos conteúdo para exibir no momento.",
  },
};

const EmptyState = React.memo(function EmptyState({ type = "generic", title, description, ctaLabel, onCta, primary }: EmptyStateProps) {
  const preset = PRESETS[type];
  const Icon = preset.icon;
  const displayTitle = title || preset.title;
  const displayDesc = description || preset.description;
  const accentColor = primary || "hsl(var(--primary))";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12 px-8 text-center"
    >
      <div
        className="h-20 w-20 rounded-3xl flex items-center justify-center mb-5"
        style={{ backgroundColor: `${accentColor}12` }}
      >
        <Icon className="h-10 w-10" strokeWidth={1.4} style={{ color: `${accentColor}` }} />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1.5">{displayTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed">{displayDesc}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          {ctaLabel}
        </button>
      )}
    </motion.div>
  );
});

export default EmptyState;
