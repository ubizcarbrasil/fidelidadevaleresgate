import { useState, useEffect } from "react";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { MapPin, ChevronRight, Coins, Navigation, Loader2 } from "lucide-react";
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
    <div className="space-y-4 pb-4">
      {/* Compact Header: Greeting + Points Badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg mx-auto px-5 pt-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading, color: fg }}>
              {greeting}, <span style={{ color: accent }}>{firstName}</span>! 👋
            </h2>
          </div>
          {/* Points Badge */}
          {loading ? (
            <Skeleton className="h-9 w-24 rounded-full" />
          ) : (
            <button
              onClick={() => { haptic("light"); onOpenLedger?.(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}25` }}
            >
              <Coins className="h-4 w-4" style={{ color: accent }} />
              <span className="text-sm font-bold" style={{ color: accent }}>
                {customer ? Number(customer.points_balance).toLocaleString("pt-BR") : "0"}
              </span>
              <span className="text-[10px] font-medium" style={{ color: `${accent}90` }}>pts</span>
            </button>
          )}
        </div>

        {/* City Line — clickable to re-detect or change */}
        <button
          onClick={handleRedetect}
          disabled={detecting}
          className="flex items-center gap-1.5 mt-1.5 active:scale-[0.97] transition-transform group"
        >
          {detecting ? (
            <Loader2 className="h-3 w-3 animate-spin" style={{ color: primary }} />
          ) : (
            <Navigation className="h-3 w-3" style={{ color: geoDetected ? primary : `${fg}50` }} />
          )}
          <span className="text-[11px]" style={{ color: `${fg}60` }}>
            {detecting
              ? "Detectando sua cidade..."
              : cityName
                ? <>Ofertas em: <strong style={{ color: geoDetected ? primary : undefined }}>{cityName}</strong></>
                : "Toque para detectar sua cidade"
            }
          </span>
          {!detecting && hasMultipleBranches && (
            <ChevronRight className="h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity" />
          )}
        </button>
      </motion.div>

      {/* Dynamic Sections - Banners come first from HomeSectionsRenderer */}
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
      >
        <SegmentNavSection
          onSegmentClick={(id, name, iconName) => handleCategoryClick(id, name, iconName)}
          onSeeMore={() => setCategoryGridOpen(true)}
        />
      </motion.div>

      {/* Dynamic Sections - Content (non-banners) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" as const }}
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
