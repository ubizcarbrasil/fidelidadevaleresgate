import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { Star, ChevronRight, Coins, Tag, Gift, Percent, Store, Sparkles, QrCode } from "lucide-react";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";
import EmissorasSection from "@/components/customer/EmissorasSection";
import AchadinhoSection from "@/components/customer/AchadinhoSection";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

const QUICK_ACTIONS = [
  { key: "ofertas", label: "Ofertas", icon: Tag, color: "#FF6B35" },
  { key: "cupons", label: "Cupons", icon: Percent, color: "#E91E63" },
  { key: "lojas", label: "Lojas", icon: Store, color: "#7C3AED" },
  { key: "pontos", label: "Pontos", icon: Coins, color: "#059669" },
  { key: "presentes", label: "Presentes", icon: Gift, color: "#D97706" },
  { key: "achadinhos", label: "Achadinhos", icon: Sparkles, color: "#0EA5E9" },
  { key: "qrcode", label: "QR Code", icon: QrCode, color: "#6366F1" },
];

export default function CustomerHomePage() {
  const { customer, loading } = useCustomer();
  const { theme } = useBrand();

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  return (
    <div className="space-y-5">
      {/* Points Balance Card */}
      {loading ? (
        <div className="max-w-lg mx-auto px-5 pt-4">
          <Skeleton className="h-[110px] w-full rounded-[20px]" />
        </div>
      ) : customer ? (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="max-w-lg mx-auto px-5 pt-4"
        >
          <div
            className="rounded-[20px] p-4 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 50%, ${primary}99 100%)`,
              boxShadow: `0 8px 32px -8px ${primary}60`,
            }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 opacity-90">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-medium">Seu saldo</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight" style={{ fontFamily: fontHeading }}>
                  {Number(customer.points_balance).toLocaleString("pt-BR")}
                </span>
                <span className="text-xs opacity-70 font-medium">pontos</span>
              </div>

              {Number(customer.money_balance) > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
                  <Coins className="h-3 w-3" />
                  <span className="text-xs">R$ {Number(customer.money_balance).toFixed(2)} disponível</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Quick Actions Bar (Méliuz-style) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="max-w-lg mx-auto"
      >
        <div className="flex gap-1 overflow-x-auto scrollbar-hide px-5 pb-1">
          {QUICK_ACTIONS.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * idx, duration: 0.25 }}
                className="flex flex-col items-center gap-1.5 min-w-[64px] py-2 active:scale-95 transition-transform"
              >
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${action.color}12` }}
                >
                  <Icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: `${fg}70` }}>
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Dynamic Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" as const }}
      >
        <HomeSectionsRenderer />
      </motion.div>

      {/* Lojas Emissoras Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" as const }}
      >
        <EmissorasSection />
      </motion.div>

      {/* Achadinhos Marketplace Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" as const }}
      >
        <AchadinhoSection />
      </motion.div>

      {/* Footer text */}
      {theme?.footer_text && (
        <div className="text-center py-6 text-xs opacity-30 px-4">{theme.footer_text}</div>
      )}
    </div>
  );
}
