import { useState, useEffect, useMemo } from "react";
import { useAutoSeedDemo } from "@/hooks/useAutoSeedDemo";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { ChevronRight, Coins, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";
import SegmentNavSection from "@/components/customer/SegmentNavSection";
import { hslToCss } from "@/lib/utils";

import ForYouSection from "@/components/customer/ForYouSection";
import EmissorasSection from "@/components/customer/EmissorasSection";
import AchadinhoSection from "@/components/customer/AchadinhoSection";
import { Skeleton } from "@/components/ui/skeleton";
import { haptic } from "@/lib/haptics";
import type { NativeSectionConfig } from "@/components/page-builder-v2/PageSectionsEditor";

const DEFAULT_NATIVE_SECTIONS: NativeSectionConfig[] = [
  { key: "BANNERS", label: "Banners", enabled: true, order: 0 },
  { key: "CATEGORIES", label: "Categorias", enabled: true, order: 1 },
  { key: "FOR_YOU", label: "Selecionado para Você", enabled: true, order: 2 },
  { key: "EMISSORAS", label: "Compre e Pontue", enabled: true, order: 3 },
  { key: "ACHADINHOS", label: "Achadinhos", enabled: true, order: 4 },
];

// hslToCss imported from @/lib/utils

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

interface CustomerHomePageProps {
  onOpenLedger?: () => void;
  onOpenCategoryGrid?: () => void;
  onOpenCategoryStores?: (category: { id: string; name: string; icon_name: string | null }) => void;
  onOpenAchadinhoCategoryGrid?: () => void;
}

export default function CustomerHomePage({ onOpenLedger, onOpenCategoryGrid, onOpenCategoryStores, onOpenAchadinhoCategoryGrid }: CustomerHomePageProps) {
  const { customer, loading } = useCustomer();
  const { brand, branches, selectedBranch, setSelectedBranch, detectBranchByLocation, theme } = useBrand();
  const { navigateToOffersWithSegment } = useCustomerNav();

  const [detecting, setDetecting] = useState(false);
  const [geoDetected, setGeoDetected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-seed demo data if taxonomy is missing on first visit
  useAutoSeedDemo(brand?.id, selectedBranch?.id);
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
    onOpenCategoryStores?.({ id: categoryId, name: categoryName, icon_name: iconName });
  };

  // Resolve native sections from brand settings
  const nativeSections = useMemo(() => {
    const layout = brand?.home_layout_json as any;
    if (layout?.native_sections && Array.isArray(layout.native_sections)) {
      return [...layout.native_sections].sort((a: NativeSectionConfig, b: NativeSectionConfig) => a.order - b.order);
    }
    return DEFAULT_NATIVE_SECTIONS;
  }, [brand?.home_layout_json]);

  const isNativeEnabled = (key: string) => {
    const section = nativeSections.find((s: NativeSectionConfig) => s.key === key);
    return section ? section.enabled : true;
  };

  const renderNativeSection = (key: string) => {
    if (!isNativeEnabled(key)) return null;

    switch (key) {
      case "BANNERS":
        return (
          <div key="banners" className="mt-3 animate-fade-in">
            <HomeSectionsRenderer renderBannersOnly />
          </div>
        );
      case "CATEGORIES":
        return (
          <div key="categories" className="mt-6 animate-fade-in">
            <SegmentNavSection
              onSegmentClick={(id, name, iconName) => handleCategoryClick(id, name, iconName)}
              onSeeMore={() => onOpenCategoryGrid?.()}
            />
          </div>
        );
      case "FOR_YOU":
        return (
          <div key="foryou" className="mt-6 animate-fade-in">
            <ForYouSection />
          </div>
        );
      case "EMISSORAS":
        return (
          <div key="emissoras" className="mt-6 animate-fade-in">
            <EmissorasSection />
          </div>
        );
      case "ACHADINHOS":
        return (
          <div key="achadinhos" className="mt-6 animate-fade-in">
            <AchadinhoSection onOpenAllCategories={onOpenAchadinhoCategoryGrid} />
          </div>
        );
      default:
        return null;
    }
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
                  {customer ? `${Number(customer.points_balance).toLocaleString("pt-BR")} pts` : "0 pts"}
                </span>
              </div>
            </button>
          )}
        </div>


      </motion.div>

      {/* Render native sections in configured order */}
      {nativeSections.map((ns: NativeSectionConfig, idx: number) => renderNativeSection(ns.key, idx))}

      {/* Dynamic CMS Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" as const }}
        className="mt-6"
      >
        <HomeSectionsRenderer skipBanners />
      </motion.div>

      {/* Footer text */}
      {theme?.footer_text && (
        <div className="text-center py-8 text-xs text-foreground/30 px-4">{theme.footer_text}</div>
      )}

    </div>
  );
}
