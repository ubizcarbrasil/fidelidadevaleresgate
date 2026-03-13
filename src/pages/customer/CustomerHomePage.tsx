import { useState, useEffect } from "react";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Navigation, ChevronRight, Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";
import SegmentNavSection from "@/components/customer/SegmentNavSection";
import CategoryGridOverlay from "@/components/customer/CategoryGridOverlay";
import CategoryStoresOverlay from "@/components/customer/CategoryStoresOverlay";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from "@/lib/haptics";

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

interface CustomerHomePageProps {
  onOpenLedger?: () => void;
}

export default function CustomerHomePage({ onOpenLedger }: CustomerHomePageProps) {
  const { customer, loading } = useCustomer();
  const { brand, branches, selectedBranch, setSelectedBranch, detectBranchByLocation, theme } = useBrand();
  const { navigateToOffersWithSegment } = useCustomerNav();

  const [categoryGridOpen, setCategoryGridOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; icon_name: string | null } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [geoDetected, setGeoDetected] = useState(false);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const accent = hslToCss(theme?.colors?.secondary, "") || primary;
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const firstName = customer?.name?.split(" ")[0] || "Visitante";
  const greeting = getGreeting();
  const cityName = selectedBranch?.city || selectedBranch?.name || "";
  const hasMultipleBranches = branches.length > 1;

  // Auto-detect on mount if no branch selected and multiple branches
  useEffect(() => {
    if (!hasMultipleBranches || selectedBranch) return;
    const autoDetect = async () => {
      setDetecting(true);
      const nearest = await detectBranchByLocation();
      if (nearest) {
        await setSelectedBranch(nearest);
        setGeoDetected(true);
        toast.success(`📍 Localização detectada: ${nearest.city || nearest.name}`);
      }
      setDetecting(false);
    };
    autoDetect();
  }, [hasMultipleBranches, selectedBranch]);

  const handleRedetect = async () => {
    haptic("light");
    setDetecting(true);
    const nearest = await detectBranchByLocation();
    if (nearest) {
      await setSelectedBranch(nearest);
      setGeoDetected(true);
      toast.success(`📍 Cidade atualizada: ${nearest.city || nearest.name}`);
    } else {
      toast.error("Não foi possível detectar sua localização");
    }
    setDetecting(false);
  };

  const handleCategoryClick = (categoryId: string, categoryName: string, iconName: string | null) => {
    setSelectedCategory({ id: categoryId, name: categoryName, icon_name: iconName });
  };

  return (
    <div className="pb-4">
      {/* Compact hero: Greeting + Balance + Location */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg mx-auto px-4 pt-3 pb-2"
      >
        {/* Greeting + Points row */}
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-base font-bold"
            style={{ fontFamily: fontHeading, color: "hsl(var(--foreground))" }}
          >
            {greeting}, <span style={{ color: accent }}>{firstName}</span>
          </h2>
          {loading ? (
            <Skeleton className="h-8 w-24 rounded-full" />
          ) : (
            <button
              onClick={() => { haptic("light"); onOpenLedger?.(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              style={{
                backgroundColor: "hsl(var(--vb-gold) / 0.15)",
                border: "1px solid hsl(var(--vb-gold) / 0.3)",
              }}
            >
              <Coins className="h-3.5 w-3.5" style={{ color: "hsl(var(--vb-gold))" }} />
              <span className="text-sm font-bold" style={{ color: "hsl(var(--vb-gold))" }}>
                {customer ? Number(customer.points_balance).toLocaleString("pt-BR") : "0"}
              </span>
              <span className="text-[10px] font-medium" style={{ color: "hsl(var(--vb-gold) / 0.7)" }}>pts</span>
            </button>
          )}
        </div>

        {/* Location line */}
        <button
          onClick={handleRedetect}
          disabled={detecting}
          className="flex items-center gap-1.5 active:scale-[0.97] transition-transform group"
        >
          {detecting ? (
            <Loader2 className="h-3 w-3 animate-spin" style={{ color: accent }} />
          ) : (
            <Navigation className="h-3 w-3" style={{ color: geoDetected ? accent : "hsl(var(--muted-foreground))" }} />
          )}
          <span className="text-[11px] text-muted-foreground">
            {detecting
              ? "Detectando sua cidade..."
              : cityName
                ? <>Ofertas em: <strong style={{ color: geoDetected ? accent : "hsl(var(--foreground))" }}>{cityName}</strong></>
                : "Toque para detectar sua cidade"
            }
          </span>
          {!detecting && hasMultipleBranches && (
            <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-opacity" />
          )}
        </button>
      </motion.div>

      {/* Banner Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <HomeSectionsRenderer renderBannersOnly />
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="mt-3"
      >
        <SegmentNavSection
          onSegmentClick={(id, name, iconName) => handleCategoryClick(id, name, iconName)}
          onSeeMore={() => setCategoryGridOpen(true)}
        />
      </motion.div>

      {/* Dynamic Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" as const }}
        className="mt-2"
      >
        <HomeSectionsRenderer skipBanners />
      </motion.div>

      {/* Footer text */}
      {theme?.footer_text && (
        <div className="text-center py-8 text-xs text-muted-foreground/30 px-4">{theme.footer_text}</div>
      )}

      {/* Category Grid Overlay */}
      <AnimatePresence>
        {categoryGridOpen && (
          <CategoryGridOverlay
            onBack={() => setCategoryGridOpen(false)}
            onCategoryClick={(cat) => {
              setCategoryGridOpen(false);
              handleCategoryClick(cat.id, cat.name, cat.icon_name);
            }}
          />
        )}
      </AnimatePresence>

      {/* Category Stores Overlay */}
      <AnimatePresence>
        {selectedCategory && (
          <CategoryStoresOverlay
            category={selectedCategory}
            onBack={() => setSelectedCategory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
