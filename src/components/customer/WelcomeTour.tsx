import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Tag, Ticket, ChevronRight, X } from "lucide-react";

interface WelcomeTourProps {
  onComplete: () => void;
  primary?: string;
  brandName?: string;
}

const SLIDES = [
  {
    icon: Coins,
    color: "#059669",
    bg: "#A7F3D0",
    title: "Acumule pontos",
    description: "Compre nos parceiros emissores e acumule pontos automaticamente a cada compra.",
  },
  {
    icon: Tag,
    color: "#7C3AED",
    bg: "#DDD6FE",
    title: "Descubra ofertas",
    description: "Encontre cupons exclusivos, descontos e promoções dos melhores parceiros da região.",
  },
  {
    icon: Ticket,
    color: "#E91E63",
    bg: "#F8C8D8",
    title: "Resgate recompensas",
    description: "Use seus pontos e saldo para resgatar ofertas incríveis. É fácil e rápido!",
  },
];

export default function WelcomeTour({ onComplete, primary, brandName }: WelcomeTourProps) {
  const [step, setStep] = useState(0);
  const accent = primary || "hsl(var(--primary))";

  const next = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg bg-card rounded-t-3xl px-6 pt-6 pb-10 relative"
      >
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center bg-black/5"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {brandName && (
          <p className="text-xs font-semibold text-muted-foreground mb-4 tracking-wide uppercase">
            Bem-vindo ao {brandName}
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center text-center"
          >
            {(() => {
              const slide = SLIDES[step];
              const Icon = slide.icon;
              return (
                <>
                  <div
                    className="h-20 w-20 rounded-3xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: slide.bg }}
                  >
                    <Icon className="h-10 w-10" strokeWidth={1.4} style={{ color: slide.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{slide.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
                    {slide.description}
                  </p>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                backgroundColor: i === step ? accent : "hsl(var(--muted))",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ backgroundColor: accent }}
        >
          {step < SLIDES.length - 1 ? "Próximo" : "Começar!"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
