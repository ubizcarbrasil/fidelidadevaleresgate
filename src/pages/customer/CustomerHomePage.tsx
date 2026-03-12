import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { ChevronRight, Coins } from "lucide-react";
import AppIcon from "@/components/customer/AppIcon";
import type { AppIconKey } from "@/hooks/useAppIcons";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";
import EmissorasSection from "@/components/customer/EmissorasSection";
import AchadinhoSection from "@/components/customer/AchadinhoSection";
import SegmentNavSection from "@/components/customer/SegmentNavSection";
import ForYouSection from "@/components/customer/ForYouSection";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { haptic } from "@/lib/haptics";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

/** Parse "H S% L%" into components for safe alpha usage */
function parseHsl(hsl: string | undefined, fallback: string): { h: string; s: string; l: string; raw: string } {
  const raw = hsl || fallback;
  const parts = raw.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  return { h: parts[0] || "250", s: parts[1] || "65%", l: parts[2] || "55%", raw };
}

function hslAlpha(parsed: { h: string; s: string; l: string }, alpha: number): string {
  return `hsla(${parsed.h}, ${parsed.s}, ${parsed.l}, ${alpha})`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const QUICK_ACTIONS: { key: string; label: string; iconKey: AppIconKey; color: string; bg: string; tab: "offers" | "wallet" | null }[] = [
  { key: "ofertas", label: "Ofertas", iconKey: "quick_ofertas", color: "#FF6B35", bg: "#FFE0CC", tab: "offers" },
  { key: "cupons", label: "Cupons", iconKey: "quick_cupons", color: "#E91E63", bg: "#F8C8D8", tab: "offers" },
  { key: "lojas", label: "Parceiros", iconKey: "quick_parceiros", color: "#7C3AED", bg: "#DDD6FE", tab: null },
  { key: "pontos", label: "Pontos", iconKey: "quick_pontos", color: "#059669", bg: "#A7F3D0", tab: "wallet" },
  { key: "presentes", label: "Presentes", iconKey: "quick_presentes", color: "#D97706", bg: "#FDE68A", tab: "offers" },
  { key: "achadinhos", label: "Achadinhos", iconKey: "quick_achadinhos", color: "#0EA5E9", bg: "#BAE6FD", tab: null },
];

interface CustomerHomePageProps {
  onOpenLedger?: () => void;
}

export default function CustomerHomePage({ onOpenLedger }: CustomerHomePageProps) {
  const { customer, loading } = useCustomer();
  const { theme } = useBrand();
  const { navigateToTab, navigateToOffersWithSegment } = useCustomerNav();

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const accent = hslToCss(theme?.colors?.secondary, "") || primary;
  const accentParsed = parseHsl(theme?.colors?.secondary || theme?.colors?.primary, "250 65% 55%");
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
          {greeting}, <span style={{ color: accent }}>{firstName}</span>! 👋
        </h2>
        <p className="text-xs mt-0.5 text-muted-foreground">
          Confira suas ofertas e pontos
        </p>
      </motion.div>

      {/* Unified Hero Card — R$ + Pontos */}
      {loading ? (
        <div className="max-w-lg mx-auto px-5">
          <Skeleton className="h-[140px] w-full rounded-3xl" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="max-w-lg mx-auto px-5"
        >
          <div
            className="w-full rounded-3xl p-0 relative overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${hslAlpha(accentParsed, 1)} 0%, ${hslAlpha(accentParsed, 0.87)} 40%, ${hslAlpha(accentParsed, 0.67)} 100%)`,
              boxShadow: `0 8px 32px -8px ${hslAlpha(accentParsed, 0.38)}`,
            }}
          >
            {/* Decorative shapes */}
            <div
              className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
              style={{ background: "rgba(255,255,255,0.07)" }}
            />
            <div
              className="absolute top-4 right-12 h-20 w-20 rounded-[20px] rotate-12"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div
              className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />

            {/* Content */}
            <div className="relative z-10 p-5 pb-4">
              <div className="flex flex-col items-center text-center">
                {/* Pontos */}
                <button
                  onClick={() => { haptic("light"); onOpenLedger?.(); }}
                  className="active:scale-[0.97] transition-transform"
                >
                  <div className="flex items-center gap-2.5 mb-2 justify-center">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}>
                      <Coins className="h-4 w-4 text-white" strokeWidth={2.2} />
                    </div>
                    <span className="text-xs font-semibold text-white/65 tracking-wide uppercase">Seus Pontos</span>
                  </div>
                  <span className="text-[36px] font-black text-white tracking-tight leading-none" style={{ fontFamily: fontHeading }}>
                    {customer ? Number(customer.points_balance).toLocaleString("pt-BR") : "0"}
                  </span>
                </button>
              </div>

              {/* Bottom action hint */}
              <div className="flex items-center justify-center mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                <button
                  onClick={() => { haptic("light"); onOpenLedger?.(); }}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white/80 transition-colors active:scale-95"
                >
                  <span className="text-[11px] font-semibold tracking-wide">Ver extrato completo</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
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
          {QUICK_ACTIONS.map((action, idx) => (
              <motion.button
                key={action.key}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.04 * idx, duration: 0.25 }}
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center gap-1.5 py-1"
                onClick={() => { haptic("light"); action.tab && navigateToTab(action.tab); }}
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: action.bg }}
                >
                  <AppIcon iconKey={action.iconKey} className="h-6 w-6" strokeWidth={1.8} style={{ color: action.color }} />
                </div>
                <span className="text-[11px] font-semibold leading-tight text-center text-muted-foreground">
                  {action.label}
                </span>
              </motion.button>
            ))}
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

      {/* "Para Você" - Personalized recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22, ease: "easeOut" as const }}
      >
        <ForYouSection />
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