import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { CreditCard, ChevronRight, Coins, Tag, Gift, Percent, Store, Sparkles, QrCode } from "lucide-react";
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
  { key: "ofertas", label: "Ofertas", icon: Tag, color: "#FF6B35", tab: "offers" as const },
  { key: "cupons", label: "Cupons", icon: Percent, color: "#E91E63", tab: "offers" as const },
  { key: "lojas", label: "Lojas", icon: Store, color: "#7C3AED", tab: null },
  { key: "pontos", label: "Pontos", icon: Coins, color: "#059669", tab: "wallet" as const },
  { key: "presentes", label: "Presentes", icon: Gift, color: "#D97706", tab: "offers" as const },
  { key: "achadinhos", label: "Achadinhos", icon: Sparkles, color: "#0EA5E9", tab: null },
  { key: "qrcode", label: "QR Code", icon: QrCode, color: "#6366F1", tab: "wallet" as const },
];

interface CustomerHomePageProps {
  onOpenLedger?: () => void;
}

export default function CustomerHomePage({ onOpenLedger }: CustomerHomePageProps) {
  const { customer, loading } = useCustomer();
  const { theme } = useBrand();
  const { navigateToTab } = useCustomerNav();

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  // Truncated account number from customer ID
  const accountNumber = customer?.id ? customer.id.slice(-8).toUpperCase() : "--------";

  return (
    <div className="space-y-5">
      {/* Bank-style Balance Card */}
      {loading ? (
        <div className="max-w-lg mx-auto px-5 pt-4">
          <Skeleton className="h-[140px] w-full rounded-[20px]" />
        </div>
      ) : customer ? (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="max-w-lg mx-auto px-5 pt-4"
        >
          <button
            onClick={onOpenLedger}
            className="w-full text-left rounded-[20px] p-5 text-white relative overflow-hidden active:scale-[0.98] transition-transform"
            style={{
              background: `linear-gradient(145deg, ${primary} 0%, ${primary}dd 40%, ${primary}aa 100%)`,
              boxShadow: `0 12px 40px -12px ${primary}50`,
            }}
          >
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-[0.07]" style={{ backgroundColor: "#fff" }} />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-[0.07]" style={{ backgroundColor: "#fff" }} />
            <div className="absolute top-4 right-4 w-20 h-14 rounded-lg border border-white/10 opacity-20" />

            <div className="relative z-10">
              {/* Header row: chip + account */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  {/* Chip icon */}
                  <div className="h-8 w-10 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" }}>
                    <div className="grid grid-cols-2 gap-px">
                      <div className="w-1.5 h-1.5 rounded-sm bg-yellow-800/40" />
                      <div className="w-1.5 h-1.5 rounded-sm bg-yellow-800/40" />
                      <div className="w-1.5 h-1.5 rounded-sm bg-yellow-800/40" />
                      <div className="w-1.5 h-1.5 rounded-sm bg-yellow-800/40" />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium tracking-[0.15em] opacity-60 uppercase">Conta Digital</span>
                </div>
                <div className="flex items-center gap-1 opacity-60">
                  <span className="text-[10px] font-mono tracking-wider">•••• {accountNumber.slice(-4)}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Balance */}
              <div className="mb-1">
                <span className="text-[11px] font-medium opacity-60 block mb-0.5">Seu saldo</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight" style={{ fontFamily: fontHeading }}>
                    {Number(customer.points_balance).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-xs opacity-50 font-medium">pontos</span>
                </div>
              </div>

              {/* Money balance row */}
              {Number(customer.money_balance) > 0 && (
                <div className="flex items-center gap-1.5 mt-1 opacity-70">
                  <Coins className="h-3 w-3" />
                  <span className="text-xs font-medium">R$ {Number(customer.money_balance).toFixed(2)} disponível</span>
                </div>
              )}

              {/* CTA hint */}
              <div className="mt-3 flex items-center gap-1 text-[10px] opacity-40 font-medium">
                <CreditCard className="h-3 w-3" />
                <span>Toque para ver extrato</span>
              </div>
            </div>
          </button>
        </motion.div>
      ) : null}

      {/* Quick Actions Bar */}
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
                onClick={() => action.tab && navigateToTab(action.tab)}
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
