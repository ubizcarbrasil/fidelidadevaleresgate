import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useAutoSeedDemo } from "@/hooks/useAutoSeedDemo";
import { useCustomer } from "@/contexts/CustomerContext";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Coins } from "lucide-react";
import { toast } from "sonner";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";
import SegmentNavSection from "@/components/customer/SegmentNavSection";
import { hslToCss } from "@/lib/utils";

const ForYouSection = lazy(() => import("@/components/customer/ForYouSection"));
const EmissorasSection = lazy(() => import("@/components/customer/EmissorasSection"));
const AchadinhoSection = lazy(() => import("@/components/customer/AchadinhoSection"));
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
            <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl mx-4" />}>
              <ForYouSection />
            </Suspense>
          </div>
        );
      case "EMISSORAS":
        return (
          <div key="emissoras" className="mt-6 animate-fade-in">
            <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl mx-4" />}>
              <EmissorasSection />
            </Suspense>
          </div>
        );
      case "ACHADINHOS":
        return (
          <div key="achadinhos" className="mt-6 animate-fade-in">
            <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl mx-4" />}>
              <AchadinhoSection onOpenAllCategories={onOpenAchadinhoCategoryGrid} />
            </Suspense>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-4">
      {/* Render native sections in configured order */}
      {nativeSections.map((ns: NativeSectionConfig) => renderNativeSection(ns.key))}

      {/* Dynamic CMS Sections */}
      <div className="mt-6 animate-fade-in">
        <HomeSectionsRenderer skipBanners />
      </div>

      {/* Footer text */}
      {theme?.footer_text && (
        <div className="text-center py-8 text-xs text-foreground/30 px-4">{theme.footer_text}</div>
      )}

    </div>
  );
}
