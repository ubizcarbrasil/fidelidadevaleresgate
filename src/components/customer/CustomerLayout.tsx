import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import AppIcon from "@/components/customer/AppIcon";
import BranchPickerSheet from "@/components/customer/BranchPickerSheet";
import NotificationDrawer from "@/components/customer/NotificationDrawer";
import CategoryGridOverlay from "@/components/customer/CategoryGridOverlay";
import AchadinhoCategoryGridOverlay from "@/components/customer/AchadinhoCategoryGridOverlay";
import AchadinhoDealsOverlay from "@/components/customer/AchadinhoDealsOverlay";
import CategoryStoresOverlay from "@/components/customer/CategoryStoresOverlay";
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
import { AnimatePresence, motion } from "framer-motion";
import CustomerHomePage from "@/pages/customer/CustomerHomePage";
import CustomerSearchOverlay from "@/components/customer/CustomerSearchOverlay";
import SectionDetailOverlay from "@/components/customer/SectionDetailOverlay";
import CustomerLedgerOverlay from "@/components/customer/CustomerLedgerOverlay";
import { useCustomerFavorites } from "@/hooks/useCustomerFavorites";
import WelcomeTour from "@/components/customer/WelcomeTour";
import { haptic } from "@/lib/haptics";
import { useBrandModules } from "@/hooks/useBrandModules";
import { hslToCss } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";
import type { OfferWithStore, NavOffer, NavStore } from "@/types/customer";

// Lazy-loaded tab pages (not needed on initial render)
const CustomerOffersPage = lazy(() => import("@/pages/customer/CustomerOffersPage"));
const CustomerRedemptionsPage = lazy(() => import("@/pages/customer/CustomerRedemptionsPage"));
const CustomerWalletPage = lazy(() => import("@/pages/customer/CustomerWalletPage"));
const CustomerProfilePage = lazy(() => import("@/pages/customer/CustomerProfilePage"));
const CustomerEmissorasPage = lazy(() => import("@/pages/customer/CustomerEmissorasPage"));

// Lazy-loaded overlays (rendered on demand)
const CustomerOfferDetailPage = lazy(() => import("@/pages/customer/CustomerOfferDetailPage"));
const CustomerStoreDetailPage = lazy(() => import("@/pages/customer/CustomerStoreDetailPage"));

interface SectionDetail {
  title: string | null;
  subtitle: string | null;
  banner_image_url?: string | null;
  banner_height?: string;
  templateType?: string;
}

interface SectionItem {
  id: string;
  name?: string;
  title?: string;
  [key: string]: unknown;
}

interface CustomerNavContextType {
  openOffer: (offer: NavOffer) => void;
  openStore: (store: NavStore) => void;
  openSectionDetail: (section: SectionDetail, items: SectionItem[]) => void;
  isFavorite: (offerId: string) => boolean;
  toggleFavorite: (offerId: string) => void;
  navigateToTab: (tab: Tab) => void;
  navigateToOffersWithSegment: (segmentId: string) => void;
  activeSegmentFilter: string | null;
  clearSegmentFilter: () => void;
  openEmissorasList?: () => void;
}
const CustomerNavContext = createContext<CustomerNavContextType>({
  openOffer: () => {}, openStore: () => {}, openSectionDetail: () => {},
  isFavorite: () => false, toggleFavorite: () => {},
  navigateToTab: () => {},
  navigateToOffersWithSegment: () => {},
  activeSegmentFilter: null,
  clearSegmentFilter: () => {},
  openEmissorasList: () => {},
});
export const useOfferNav = () => useContext(CustomerNavContext);
export const useCustomerNav = () => useContext(CustomerNavContext);

// Tab loading fallback
function TabSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
      <Skeleton className="h-6 w-48 rounded-lg" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

type Tab = "home" | "offers" | "redemptions" | "wallet" | "profile";

import type { AppIconKey } from "@/hooks/useAppIcons";

const TABS: { key: Tab; label: string; iconKey: AppIconKey; moduleKey?: string }[] = [
  { key: "home", label: "Início", iconKey: "nav_home" },
  { key: "offers", label: "Ofertas", iconKey: "nav_offers", moduleKey: "offers" },
  { key: "redemptions", label: "Resgates", iconKey: "nav_redemptions", moduleKey: "redemption_qr" },
  { key: "wallet", label: "Carteira", iconKey: "nav_wallet", moduleKey: "wallet" },
  { key: "profile", label: "Perfil", iconKey: "nav_profile" },
];

const TAB_CONTENT: Record<Tab, React.FC<any>> = {
  home: CustomerHomePage,
  offers: CustomerOffersPage,
  redemptions: CustomerRedemptionsPage,
  wallet: CustomerWalletPage,
  profile: CustomerProfilePage,
};

// Removed heavy tab transition variants — using CSS animate-fade-in instead

export default function CustomerLayout() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const { isModuleEnabled } = useBrandModules();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedOffer, setSelectedOffer] = useState<NavOffer | null>(null);
  const [selectedStore, setSelectedStore] = useState<NavStore | null>(null);
  const [sectionDetail, setSectionDetail] = useState<{ section: SectionDetail; items: SectionItem[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [emissorasOpen, setEmissorasOpen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<string | null>(null);
  const [categoryGridOpen, setCategoryGridOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; icon_name: string | null } | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [achadinhoCatGridOpen, setAchadinhoCatGridOpen] = useState(false);
  const [selectedAchadinhoCat, setSelectedAchadinhoCat] = useState<{ id: string; name: string; icon_name: string; color: string } | null>(null);
  const { isFavorite, toggleFavorite } = useCustomerFavorites();
  const { unreadCount } = useCustomerNotifications();

  const filteredTabs = useMemo(() =>
    TABS.filter(t => !t.moduleKey || isModuleEnabled(t.moduleKey)),
    [isModuleEnabled]
  );

  // Auto-hide header on scroll down, show on scroll up
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const rafRef = useRef(0);
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      const el = mainRef.current;
      if (el) {
        const currentY = el.scrollTop;
        const delta = currentY - lastScrollY.current;
        if (delta > 8 && currentY > 60) {
          setHeaderVisible(false);
        } else if (delta < -5) {
          setHeaderVisible(true);
        }
        lastScrollY.current = currentY;
      }
      rafRef.current = 0;
    });
  }, []);

  // Default to dark mode for customer app (respect user preference if saved)
  useEffect(() => {
    const saved = localStorage.getItem("customer_dark_mode");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  // Show welcome tour on first visit
  useEffect(() => {
    if (!customer) return;
    const key = `welcome_tour_${customer.id}`;
    if (!localStorage.getItem(key)) {
      setShowTour(true);
    }
  }, [customer]);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const accent = hslToCss(theme?.colors?.secondary, "") || primary;
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const fontBody = theme?.font_body ? `"${theme.font_body}", sans-serif` : "inherit";
  const displayName = theme?.display_name || brand?.name || "";
  const navigateToOffersWithSegment = useCallback((segmentId: string) => {
    setSegmentFilter(segmentId);
    setActiveTab("offers");
  }, []);

  const clearSegmentFilter = useCallback(() => setSegmentFilter(null), []);

  const ActivePage = TAB_CONTENT[activeTab];

  // Click tracking: log offer/store views for recommendation engine
  const trackClick = useCallback((entityType: "offer" | "store", entityId: string, storeId?: string) => {
    if (!customer || !brand || !selectedBranch) return;
    supabase.from("customer_click_events").insert({
      customer_id: customer.id,
      brand_id: brand.id,
      branch_id: selectedBranch.id,
      entity_type: entityType,
      entity_id: entityId,
      store_id: storeId || null,
    }).then(() => {});
  }, [customer, brand, selectedBranch]);

  const handleOpenOffer = useCallback((offer: NavOffer) => {
    trackClick("offer", offer.id, offer.store_id ?? undefined);
    setSectionDetail(null);
    setSelectedOffer(offer);
  }, [trackClick]);

  const handleOpenStore = useCallback((store: NavStore) => {
    trackClick("store", store.id, store.id);
    setSectionDetail(null);
    setSelectedStore(store);
  }, [trackClick]);

  const handleOpenSectionDetail = useCallback((section: SectionDetail, items: SectionItem[]) => {
    setSectionDetail({ section, items });
  }, []);

  const handleOpenEmissoras = useCallback(() => setEmissorasOpen(true), []);

  const navValue = useMemo<CustomerNavContextType>(() => ({
    openOffer: handleOpenOffer,
    openStore: handleOpenStore,
    openSectionDetail: handleOpenSectionDetail,
    isFavorite,
    toggleFavorite,
    navigateToTab: setActiveTab,
    navigateToOffersWithSegment,
    activeSegmentFilter: segmentFilter,
    clearSegmentFilter,
    openEmissorasList: handleOpenEmissoras,
  }), [handleOpenOffer, handleOpenStore, handleOpenSectionDetail, isFavorite, toggleFavorite, navigateToOffersWithSegment, segmentFilter, clearSegmentFilter, handleOpenEmissoras]);

  return (
    <CustomerNavContext.Provider value={navValue}>
      <div className="min-h-screen flex flex-col bg-background text-foreground" style={{ fontFamily: fontBody, overscrollBehavior: "none" }}>
        {/* Dark Premium Header */}
        <header
          className="sticky top-0 z-50 transition-transform duration-300 will-change-transform"
          style={{
            transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
            backgroundColor: "hsl(var(--background))",
          }}
        >
          <div className="max-w-lg mx-auto px-4 pt-3 pb-0">
            {/* Top row: Logo/Name + actions */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                {theme?.logo_url && (
                  <img
                    src={theme.logo_url}
                    alt={displayName}
                    className="h-8 w-8 object-contain rounded-lg"
                  />
                )}
                <span
                  className="font-extrabold text-[15px] tracking-tight"
                  style={{ fontFamily: fontHeading, color: "hsl(var(--foreground))" }}
                >
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <BranchPickerSheet />
                <button
                  onClick={() => setNotifOpen(true)}
                  className="relative h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                >
                  <AppIcon iconKey="header_bell" className="h-5 w-5" strokeWidth={1.8} style={{ color: "hsl(var(--vb-highlight))" }} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: "hsl(var(--destructive))" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                  onClick={() => setActiveTab("wallet")}
                >
                  <AppIcon iconKey="header_wallet" className="h-5 w-5" strokeWidth={1.8} style={{ color: "hsl(var(--vb-highlight))" }} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-shadow mb-3"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <AppIcon iconKey="header_search" className="h-4.5 w-4.5 flex-shrink-0 text-foreground/50" />
              <span className="text-sm text-foreground/50">
                O que está procurando?
              </span>
            </button>
          </div>
          {/* Bottom divider */}
          <div className="h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
        </header>

        {/* Content with tab transition */}
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 pb-24 overflow-y-auto"
          style={{ overscrollBehavior: "none", WebkitOverflowScrolling: "touch" }}
        >
          <div key={activeTab} className="animate-fade-in">
              {activeTab === "home" ? (
                <CustomerHomePage
                  onOpenLedger={() => setLedgerOpen(true)}
                  onOpenCategoryGrid={() => setCategoryGridOpen(true)}
                  onOpenCategoryStores={(cat) => setSelectedCategory(cat)}
                  onOpenAchadinhoCategoryGrid={() => setAchadinhoCatGridOpen(true)}
                />
              ) : (
                <Suspense fallback={<TabSkeleton />}>
                  <ActivePage />
                </Suspense>
              )}
          </div>
        </main>

        {/* Bottom Tab Bar — Dark premium */}
        <nav
          className="fixed bottom-0 inset-x-0 z-50"
          style={{
            backgroundColor: "hsl(var(--card))",
            borderTop: "1px solid hsl(var(--border))",
          }}
        >
          <div className="max-w-lg mx-auto flex">
            {filteredTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    haptic("light");
                    setActiveTab(tab.key);
                    setHeaderVisible(true);
                    if (mainRef.current) mainRef.current.scrollTop = 0;
                    lastScrollY.current = 0;
                  }}
                  className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-3 transition-all relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 inset-x-0 mx-auto w-10 h-[3px] rounded-full"
                      style={{ backgroundColor: "hsl(var(--foreground))" }}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    className="h-8 w-8 rounded-xl flex items-center justify-center"
                    animate={{
                      backgroundColor: isActive ? "hsl(var(--foreground) / 0.12)" : "transparent",
                      scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <AppIcon
                      iconKey={tab.iconKey}
                      className="h-5 w-5"
                      strokeWidth={isActive ? 2.2 : 1.6}
                      style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                    />
                  </motion.div>
                  <span
                    className="text-[10px] font-semibold transition-colors"
                    style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Offer Detail Overlay */}
        <AnimatePresence>
          {selectedOffer && (
            <Suspense fallback={<TabSkeleton />}>
              <CustomerOfferDetailPage
                offer={selectedOffer as OfferWithStore}
                onBack={() => setSelectedOffer(null)}
                onOfferClick={(offer) => {
                  setSelectedOffer(null);
                  setTimeout(() => setSelectedOffer(offer), 150);
                }}
                onOpenStore={(store) => {
                  setSelectedOffer(null);
                  setTimeout(() => setSelectedStore(store), 150);
                }}
              />
            </Suspense>
          )}
        </AnimatePresence>

        {/* Store Detail Overlay */}
        <AnimatePresence>
          {selectedStore && (
            <Suspense fallback={<TabSkeleton />}>
              <CustomerStoreDetailPage
                store={selectedStore as Tables<"stores">}
                onBack={() => setSelectedStore(null)}
                onOfferClick={(offer) => {
                  setSelectedStore(null);
                  setTimeout(() => setSelectedOffer(offer), 100);
                }}
              />
            </Suspense>
          )}
        </AnimatePresence>

        {/* Section Detail Overlay */}
        <AnimatePresence>
          {sectionDetail && (
            <SectionDetailOverlay
              section={sectionDetail.section}
              items={sectionDetail.items}
              onBack={() => setSectionDetail(null)}
              primary={primary}
              fg={fg}
              fontHeading={fontHeading}
            />
          )}
        </AnimatePresence>

        {/* Search Overlay */}
        <CustomerSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Ledger Overlay */}
        <CustomerLedgerOverlay open={ledgerOpen} onBack={() => setLedgerOpen(false)} />

        {/* Emissoras List Overlay */}
        <AnimatePresence>
          {emissorasOpen && (
            <Suspense fallback={<TabSkeleton />}>
              <CustomerEmissorasPage onBack={() => setEmissorasOpen(false)} />
            </Suspense>
          )}
        </AnimatePresence>

        {/* Category Grid Overlay */}
        <AnimatePresence>
          {categoryGridOpen && (
            <CategoryGridOverlay
              onBack={() => setCategoryGridOpen(false)}
              onCategoryClick={(cat) => {
                setCategoryGridOpen(false);
                setSelectedCategory(cat);
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

        {/* Achadinhos Category Grid Overlay */}
        <AnimatePresence>
          {achadinhoCatGridOpen && (
            <AchadinhoCategoryGridOverlay
              onBack={() => setAchadinhoCatGridOpen(false)}
              onCategoryClick={(cat) => {
                setAchadinhoCatGridOpen(false);
                setSelectedAchadinhoCat(cat);
              }}
            />
          )}
        </AnimatePresence>

        {/* Achadinhos Deals Overlay */}
        <AnimatePresence>
          {selectedAchadinhoCat && (
            <AchadinhoDealsOverlay
              category={selectedAchadinhoCat}
              onBack={() => setSelectedAchadinhoCat(null)}
            />
          )}
        </AnimatePresence>

        {/* Notification Drawer */}
        <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

        {/* Welcome Tour */}
        <AnimatePresence>
          {showTour && (
            <WelcomeTour
              primary={primary}
              brandName={displayName}
              customSlides={((brand?.brand_settings_json as any)?.welcome_tour_slides) || undefined}
              onComplete={() => {
                setShowTour(false);
                if (customer) localStorage.setItem(`welcome_tour_${customer.id}`, "done");
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </CustomerNavContext.Provider>
  );
}
