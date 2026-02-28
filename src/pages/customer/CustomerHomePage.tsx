import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { Star, ChevronRight, Coins } from "lucide-react";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function CustomerHomePage() {
  const { customer, loading } = useCustomer();
  const { theme } = useBrand();

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  return (
    <div className="space-y-6">
      {/* Points Balance Card */}
      {loading ? (
        <div className="max-w-lg mx-auto px-5 pt-5">
          <Skeleton className="h-[120px] w-full rounded-[24px]" />
        </div>
      ) : customer ? (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="max-w-lg mx-auto px-5 pt-5"
        >
          <div
            className="rounded-[24px] p-5 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 50%, ${primary}99 100%)`,
              boxShadow: `0 8px 32px -8px ${primary}60`,
            }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 opacity-90">
                  <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                    <Star className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">Seu saldo</span>
                </div>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight" style={{ fontFamily: fontHeading }}>
                  {Number(customer.points_balance).toLocaleString("pt-BR")}
                </span>
                <span className="text-sm opacity-70 font-medium">pontos</span>
              </div>

              {Number(customer.money_balance) > 0 && (
                <div className="flex items-center gap-1.5 mt-2 opacity-80">
                  <Coins className="h-3.5 w-3.5" />
                  <span className="text-sm">R$ {Number(customer.money_balance).toFixed(2)} disponível</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Dynamic Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" as const }}
      >
        <HomeSectionsRenderer />
      </motion.div>

      {/* Footer text */}
      {theme?.footer_text && (
        <div className="text-center py-6 text-xs opacity-30 px-4">{theme.footer_text}</div>
      )}
    </div>
  );
}
