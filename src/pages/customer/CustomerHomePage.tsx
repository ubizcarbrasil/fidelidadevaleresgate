import { useState, useEffect } from "react";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Navigation, ChevronRight, Coins, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";
import SegmentNavSection from "@/components/customer/SegmentNavSection";
import CategoryGridOverlay from "@/components/customer/CategoryGridOverlay";
import CategoryStoresOverlay from "@/components/customer/CategoryStoresOverlay";

import ForYouSection from "@/components/customer/ForYouSection";
import EmissorasSection from "@/components/customer/EmissorasSection";
import AchadinhoSection from "@/components/customer/AchadinhoSection";
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
  const [searchQuery, setSearchQuery] = useState("");

  const accent = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
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
      {/* Hero Section: Greeting + Balance */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg mx-auto px-4 pt-4 pb-1"
      >
        {/* Top row: Greeting + Balance badge */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: fontHeading, color: "hsl(var(--foreground))" }}
            >
              {greeting},{" "}
              <span style={{ color: "hsl(var(--vb-gold))" }}>{firstName}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Confira as melhores ofertas para você
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-28 rounded-2xl" />
          ) : (
            <button
              onClick={() => { haptic("light"); onOpenLedger?.(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, hsl(var(--vb-gold)) 0%, hsl(var(--vb-gold) / 0.8) 100%)",
              }}
            >
              <Coins className="h-4 w-4" style={{ color: "hsl(var(--vb-gold-foreground))" }} />
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-medium leading-none" style={{ color: "hsl(var(--vb-gold-foreground) / 0.7)" }}>Saldo</span>
                <span className="text-sm font-bold leading-tight" style={{ color: "hsl(var(--vb-gold-foreground))" }}>
                  {customer ? `R$ ${Number(customer.points_balance).toLocaleString("pt-BR")}` : "R$ 0"}
                </span>
              </div>
            </button>
          )}
        </div>


        {/* Location line */}
        <button
          onClick={handleRedetect}
          disabled={detecting}
          className="flex items-center gap-2 active:scale-[0.97] transition-transform group mb-1"
        >
          {detecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "hsl(var(--vb-gold))" }} />
          ) : (
            <MapPin className="h-3.5 w-3.5" style={{ color: geoDetected ? "hsl(var(--vb-gold))" : "hsl(var(--muted-foreground))" }} />
          )}
          <span className="text-xs text-muted-foreground">
            {detecting
              ? "Detectando sua cidade..."
              : cityName
                ? <>Visualizando ofertas em: <strong className="text-foreground">{cityName}</strong></>
                : "Toque para detectar sua cidade"
            }
          </span>
          {!detecting && hasMultipleBranches && (
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          )}
        </button>
      </motion.div>

      {/* Banner Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="mt-2"
      >
        <HomeSectionsRenderer renderBannersOnly />
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="mt-4"
      >
        <SegmentNavSection
          onSegmentClick={(id, name, iconName) => handleCategoryClick(id, name, iconName)}
          onSeeMore={() => setCategoryGridOpen(true)}
        />
      </motion.div>

      {/* For You Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="mt-4"
      >
        <ForYouSection />
      </motion.div>

      {/* Emissoras Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14 }}
        className="mt-4"
      >
        <EmissorasSection />
      </motion.div>

      {/* Achadinhos Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.16 }}
        className="mt-4"
      >
        <AchadinhoSection />
      </motion.div>

      {/* Dynamic Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" as const }}
        className="mt-3"
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
