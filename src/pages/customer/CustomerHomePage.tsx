import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { ChevronRight, Coins, Tag, Gift, Percent, Store, Sparkles, Wallet } from "lucide-react";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";
import EmissorasSection from "@/components/customer/EmissorasSection";
import AchadinhoSection from "@/components/customer/AchadinhoSection";
import SegmentNavSection from "@/components/customer/SegmentNavSection";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const QUICK_ACTIONS = [
  { key: "ofertas", label: "Ofertas", icon: Tag, color: "#FF6B35", bg: "#FFE0CC", tab: "offers" as const },
  { key: "cupons", label: "Cupons", icon: Percent, color: "#E91E63", bg: "#F8C8D8", tab: "offers" as const },
  { key: "lojas", label: "Parceiros", icon: Store, color: "#7C3AED", bg: "#DDD6FE", tab: null },
  { key: "pontos", label: "Pontos", icon: Coins, color: "#059669", bg: "#A7F3D0", tab: "wallet" as const },
  { key: "presentes", label: "Presentes", icon: Gift, color: "#D97706", bg: "#FDE68A", tab: "offers" as const },
  { key: "achadinhos", label: "Achadinhos", icon: Sparkles, color: "#0EA5E9", bg: "#BAE6FD", tab: null },
];

interface CustomerHomePageProps {
  onOpenLedger?: () => void;
}

export default function CustomerHomePage({ onOpenLedger }: CustomerHomePageProps) {
  const { customer, loading } = useCustomer();
  const { theme } = useBrand();
  const { navigateToTab, navigateToOffersWithSegment } = useCustomerNav();

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const firstName = customer?.name?.split(" ")[0] || "Visitante";
  const greeting = getGreeting();

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg mx-auto px-5 pt-3"
      >
        <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading, color: fg }}>
          {greeting}, <span style={{ color: primary }}>{firstName}</span>! 👋
        </h2>
        <p className="text-xs mt-0.5" style={{ color: `${fg}50` }}>
          Confira suas ofertas e saldos
        </p>
      </motion.div>

      {/* Unified Hero Card — R$ + Pontos */}
      {loading ? (
        <div className="max-w-lg mx-auto px-5">
          <Skeleton className="h-[110px] w-full rounded-2xl" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="max-w-lg mx-auto px-5"
        >
          <div
            className="w-full rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primary} 0%, ${primary}CC 50%, ${primary}99 100%)`,
            }}
          >
            {/* Decorative circle */}
            <div
              className="absolute -top-8 -right-8 h-32 w-32 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            />
            <div
              className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            />

            <div className="relative z-10 flex items-stretch gap-4">
              {/* Saldo em R$ */}
              <button
                onClick={() => navigateToTab("redemptions")}
                className="flex-1 text-left active:scale-[0.97] transition-transform"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Wallet className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-medium text-white/70">Saldo</span>
                </div>
                <span className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: fontHeading }}>
                  R$ {customer ? Number(customer.money_balance).toFixed(2).replace(".", ",") : "0,00"}
                </span>
              </button>

              {/* Divider */}
              <div className="w-px self-stretch" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />

              {/* Pontos */}
              <button
                onClick={onOpenLedger}
                className="flex-1 text-left active:scale-[0.97] transition-transform"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Coins className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-medium text-white/70">Pontos</span>
                </div>
                <span className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: fontHeading }}>
                  {customer ? Number(customer.points_balance).toLocaleString("pt-BR") : "0"}
                </span>
              </button>
            </div>

            {/* CTA arrow */}
            <div className="absolute right-3 bottom-3">
              <ChevronRight className="h-4 w-4 text-white/40" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="max-w-lg mx-auto px-5"
      >
        <div className="grid grid-cols-6 gap-2">
          {QUICK_ACTIONS.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.key}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.04 * idx, duration: 0.25 }}
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center gap-1.5 py-1"
                onClick={() => action.tab && navigateToTab(action.tab)}
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: action.bg }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} style={{ color: action.color }} />
                </div>
                <span className="text-[11px] font-semibold leading-tight text-center" style={{ color: `${fg}80` }}>
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Segment Categories */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <SegmentNavSection onSegmentClick={(segId) => navigateToOffersWithSegment(segId)} />
      </motion.div>

      {/* Dynamic Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" as const }}
      >
        <HomeSectionsRenderer />
      </motion.div>

      {/* Parceiros Emissores Section */}
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
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" as const }}
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
