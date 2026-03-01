import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { ChevronRight, Coins, Tag, Gift, Percent, Store, Sparkles } from "lucide-react";
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

const QUICK_ACTIONS = [
  { key: "ofertas", label: "Ofertas", icon: Tag, color: "#FF6B35", bg: "#FFF0E8", tab: "offers" as const },
  { key: "cupons", label: "Cupons", icon: Percent, color: "#E91E63", bg: "#FCE4EC", tab: "offers" as const },
  { key: "lojas", label: "Parceiros", icon: Store, color: "#7C3AED", bg: "#EDE9FE", tab: null },
  { key: "pontos", label: "Pontos", icon: Coins, color: "#059669", bg: "#D1FAE5", tab: "wallet" as const },
  { key: "presentes", label: "Presentes", icon: Gift, color: "#D97706", bg: "#FEF3C7", tab: "offers" as const },
  { key: "achadinhos", label: "Achadinhos", icon: Sparkles, color: "#0EA5E9", bg: "#E0F2FE", tab: null },
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

  return (
    <div className="space-y-4">
      {/* Meus Resgates - clean banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-lg mx-auto px-5 pt-3"
      >
        <button
          onClick={() => navigateToTab("redemptions")}
          className="w-full rounded-2xl p-4 relative overflow-hidden active:scale-[0.98] transition-transform"
          style={{
            background: `linear-gradient(135deg, ${primary}18 0%, ${primary}0C 100%)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold" style={{ fontFamily: fontHeading, color: fg }}>
                Meus Resgates
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: `${fg}60` }}>Saldo disponível</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black" style={{ fontFamily: fontHeading, color: primary }}>
                R$ {customer ? Number(customer.money_balance).toFixed(2).replace(".", ",") : "0,00"}
              </span>
              <ChevronRight className="h-4 w-4" style={{ color: `${primary}80` }} />
            </div>
          </div>
        </button>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
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
                className="flex flex-col items-center gap-1.5 py-1 active:scale-95 transition-transform"
                onClick={() => action.tab && navigateToTab(action.tab)}
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: action.bg }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} style={{ color: action.color }} />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-center" style={{ color: `${fg}80` }}>
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Points Balance Card */}
      {loading ? (
        <div className="max-w-lg mx-auto px-5">
          <Skeleton className="h-[72px] w-full rounded-2xl" />
        </div>
      ) : customer ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="max-w-lg mx-auto px-5"
        >
          <button
            onClick={onOpenLedger}
            className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center justify-between active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: "#FFFFFF",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#FEF3C7" }}
              >
                <Coins className="h-5 w-5" style={{ color: "#D97706" }} />
              </div>
              <div>
                <span className="text-[11px] font-medium block" style={{ color: `${fg}50` }}>Meus pontos</span>
                <span className="text-lg font-black tracking-tight" style={{ fontFamily: fontHeading, color: fg }}>
                  {Number(customer.points_balance).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" style={{ color: `${fg}30` }} />
          </button>
        </motion.div>
      ) : null}

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
